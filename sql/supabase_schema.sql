-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------
-- TABLES
----------------

-- Courses table (renamed from subjects)
CREATE TABLE IF NOT EXISTS courses (
  course_name VARCHAR(255) PRIMARY KEY,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  category VARCHAR(255) PRIMARY KEY,
  course VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_course_category
    FOREIGN KEY (course)
    REFERENCES courses(course_name)
    ON DELETE CASCADE
);

-- Years table
CREATE TABLE IF NOT EXISTS years (
  year INTEGER PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Professors table
CREATE TABLE IF NOT EXISTS professors (
  professor VARCHAR(255) PRIMARY KEY,
  course VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_course_professor
    FOREIGN KEY (course)
    REFERENCES courses(course_name)
    ON DELETE CASCADE
);

-- Questions table (main table)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT,
  category VARCHAR(255),
  year INTEGER,
  professor VARCHAR(255),
  done BOOLEAN DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_category
    FOREIGN KEY (category)
    REFERENCES categories(category)
    ON DELETE SET NULL,
  CONSTRAINT fk_year
    FOREIGN KEY (year)
    REFERENCES years(year)
    ON DELETE SET NULL,
  CONSTRAINT fk_professor
    FOREIGN KEY (professor)
    REFERENCES professors(professor)
    ON DELETE SET NULL
);

----------------
-- FUNCTIONS & TRIGGERS
----------------

-- Timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-updating timestamp on courses
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-updating timestamp on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-updating timestamp on years
CREATE TRIGGER update_years_updated_at
BEFORE UPDATE ON years
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-updating timestamp on professors
CREATE TRIGGER update_professors_updated_at
BEFORE UPDATE ON professors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to insert a question with its metadata
CREATE OR REPLACE FUNCTION insert_question_with_metadata(
  question TEXT,
  answer TEXT,
  course_name VARCHAR(255),
  category VARCHAR(255) DEFAULT NULL,
  year INTEGER DEFAULT NULL, 
  professor VARCHAR(255) DEFAULT NULL
) 
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- First ensure course exists
  INSERT INTO courses (course_name)
  VALUES (course_name)
  ON CONFLICT (course_name) DO NOTHING;
  
  -- If category is provided, ensure it exists in categories table
  IF category IS NOT NULL THEN
    INSERT INTO categories (category, course)
    VALUES (category, course_name)
    ON CONFLICT (category) DO NOTHING;
  END IF;
  
  -- If year is provided, ensure it exists in years table
  IF year IS NOT NULL THEN
    INSERT INTO years (year)
    VALUES (year)
    ON CONFLICT (year) DO NOTHING;
  END IF;
  
  -- If professor is provided, ensure it exists in professors table
  IF professor IS NOT NULL THEN
    INSERT INTO professors (professor, course)
    VALUES (professor, course_name)
    ON CONFLICT (professor) DO NOTHING;
  END IF;
  
  -- Insert the question and get its ID
  INSERT INTO questions (question, answer, category, year, professor)
  VALUES (question, answer, category, year, professor)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a question from all metadata tables
CREATE OR REPLACE FUNCTION remove_question_from_metadata(
  question_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Remove from categories
  UPDATE categories
  SET questions_list = array_remove(questions_list, question_id)
  WHERE question_id = ANY(questions_list);
  
  -- Remove from years
  UPDATE years
  SET questions_list = array_remove(questions_list, question_id)
  WHERE question_id = ANY(questions_list);
  
  -- Remove from professors
  UPDATE professors
  SET questions_list = array_remove(questions_list, question_id)
  WHERE question_id = ANY(questions_list);
END;
$$ LANGUAGE plpgsql;

-- Function to get questions by metadata (with pagination)
CREATE OR REPLACE FUNCTION get_questions_by_metadata(
  course_name_filter VARCHAR(255) DEFAULT NULL,
  category_filter VARCHAR(255) DEFAULT NULL,
  year_filter INTEGER DEFAULT NULL,
  professor_filter VARCHAR(255) DEFAULT NULL,
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 10
)
RETURNS SETOF questions AS $$
BEGIN
  RETURN QUERY
  SELECT * 
  FROM questions
  WHERE (category_filter IS NULL OR category = category_filter)
    AND (year_filter IS NULL OR year = year_filter)
    AND (professor_filter IS NULL OR professor = professor_filter)
    AND (
      course_name_filter IS NULL 
      OR 
      (
        (category IS NOT NULL AND EXISTS (SELECT 1 FROM categories c WHERE c.category = category AND c.course = course_name_filter))
        OR 
        (professor IS NOT NULL AND EXISTS (SELECT 1 FROM professors p WHERE p.professor = professor AND p.course = course_name_filter))
      )
    )
  ORDER BY updated_at DESC
  LIMIT page_size
  OFFSET ((page_number - 1) * page_size);
END;
$$ LANGUAGE plpgsql;

----------------
-- VIEWS
----------------

-- View for course statistics
CREATE OR REPLACE VIEW course_question_counts AS
SELECT 
  c.course_name,
  COUNT(DISTINCT q.id) as question_count
FROM courses c
LEFT JOIN categories cat ON cat.course = c.course_name
LEFT JOIN professors p ON p.course = c.course_name
LEFT JOIN questions q ON 
  (q.category = cat.category) OR
  (q.professor = p.professor)
GROUP BY c.course_name
ORDER BY question_count DESC;

-- View for category statistics
CREATE OR REPLACE VIEW category_question_counts AS
SELECT 
  c.category,
  c.course,
  COUNT(q.*) as question_count
FROM categories c
LEFT JOIN questions q ON q.category = c.category
GROUP BY c.category, c.course
ORDER BY question_count DESC;

-- View for year statistics
CREATE OR REPLACE VIEW year_question_counts AS
SELECT 
  y.year,
  COUNT(q.*) as question_count
FROM years y
LEFT JOIN questions q ON q.year = y.year
GROUP BY y.year
ORDER BY y.year DESC;

-- View for professor statistics
CREATE OR REPLACE VIEW professor_question_counts AS
SELECT 
  p.professor,
  p.course,
  COUNT(q.*) as question_count
FROM professors p
LEFT JOIN questions q ON q.professor = p.professor
GROUP BY p.professor, p.course
ORDER BY question_count DESC; 