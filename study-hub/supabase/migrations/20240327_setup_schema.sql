-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  course_name VARCHAR(255) PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  category VARCHAR(255) PRIMARY KEY,
  course VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_course_category
    FOREIGN KEY (course)
    REFERENCES courses(course_name)
    ON DELETE CASCADE
);

-- Create years table
CREATE TABLE IF NOT EXISTS years (
  year INTEGER PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professors table
CREATE TABLE IF NOT EXISTS professors (
  professor VARCHAR(255) PRIMARY KEY,
  course VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_course_professor
    FOREIGN KEY (course)
    REFERENCES courses(course_name)
    ON DELETE CASCADE
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT,
  category VARCHAR(255),
  year INTEGER,
  professor VARCHAR(255),
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

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test_questions junction table
CREATE TABLE IF NOT EXISTS test_questions (
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (test_id, question_id)
);

-- Create test_answers table
CREATE TABLE IF NOT EXISTS test_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, question_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
CREATE POLICY "Enable read access for all users" ON courses FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON years FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON professors FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON questions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tests FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON test_questions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON test_answers FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_categories_course ON categories(course);
CREATE INDEX idx_professors_course ON professors(course);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_professor ON questions(professor);
CREATE INDEX idx_test_questions_test_id ON test_questions(test_id);
CREATE INDEX idx_test_questions_question_id ON test_questions(question_id);
CREATE INDEX idx_test_answers_test_id ON test_answers(test_id);
CREATE INDEX idx_test_answers_question_id ON test_answers(question_id); 