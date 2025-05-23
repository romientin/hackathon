CREATE OR REPLACE FUNCTION insert_questions_from_json(data JSONB)
RETURNS SETOF UUID AS $$
DECLARE
    v_course_name VARCHAR(255);
    v_year INTEGER;
    v_professor VARCHAR(255);
    v_question TEXT;
    v_answer TEXT;
    v_category VARCHAR(255);
    v_id UUID;
    v_item JSONB;
    v_result UUID[];
BEGIN
    -- Extract metadata from JSON
    v_course_name := data->>'course_name';
    v_year := (data->>'year')::INTEGER;
    v_professor := data->>'professor';
    
    -- Ensure course exists
    INSERT INTO courses (course_name)
    VALUES (v_course_name)
    ON CONFLICT (course_name) DO NOTHING;
    
    -- Ensure year exists
    IF v_year IS NOT NULL THEN
        INSERT INTO years (year)
        VALUES (v_year)
        ON CONFLICT (year) DO NOTHING;
    END IF;
    
    -- Ensure professor exists
    IF v_professor IS NOT NULL THEN
        INSERT INTO professors (professor, course)
        VALUES (v_professor, v_course_name)
        ON CONFLICT (professor) DO NOTHING;
    END IF;
    
    -- Process each question
    FOR v_item IN SELECT jsonb_array_elements(data->'questions')
    LOOP
        -- Extract question triplet
        v_question := v_item->>'question';
        v_answer := v_item->>'answer';
        v_category := v_item->>'category';
        
        -- Generate UUID
        v_id := gen_random_uuid();
        
        -- Ensure category exists
        IF v_category IS NOT NULL THEN
            INSERT INTO categories (category, course)
            VALUES (v_category, v_course_name)
            ON CONFLICT (category) DO NOTHING;
        END IF;
        
        -- Insert into questions table with all metadata including done column
        INSERT INTO questions (id, question, answer, category, year, professor, done, updated_at)
        VALUES (v_id, v_question, v_answer, v_category, v_year, v_professor, FALSE, NOW());
        
        -- Add the ID to the result array
        v_result := array_append(v_result, v_id);
        
        -- Return the question ID
        RETURN NEXT v_id;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Example usage:

SELECT * FROM insert_questions_from_json(
    '{
        "course_name": "Algorithms",
        "year": 2023,
        "professor": "Rani Hod",
        "questions": [
            {
                "question": "What is the time complexity of Dijkstra''s algorithm using a binary heap?",
                "answer": "O((V + E) log V) where V is the number of vertices and E is the number of edges.",
                "category": "Algorithms"
            },
            {
                "question": "Explain the key differences between depth-first search (DFS) and breadth-first search (BFS) traversal algorithms.",
                "answer": "DFS explores branches fully before backtracking, using stack or recursion. BFS explores all neighbors first, using a queue.",
                "category": "Graph Theory"
            }
        ]
    }'::JSONB
);
 