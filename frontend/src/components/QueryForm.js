import React, { useState } from 'react';
import axios from 'axios';

const QueryForm = () => {
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/chat', { question });
            setResponse(res.data.answer);
        } catch (error) {
            console.error("Error connecting to the backend:", error);
            setResponse("There was an error processing your question.");
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label htmlFor="question">Ask a question:</label>
                <input
                    type="text"
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />
                <button type="submit">Submit</button>
            </form>
            {response && <p>Response: {response}</p>}
        </div>
    );
};

export default QueryForm;