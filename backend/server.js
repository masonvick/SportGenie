const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { OpenAI } = require('openai');
const sql = require('mssql');

// Configure your SQL Server connection
const dbConfig = {
    user: 'sa',         // Your SQL Server username
    password: 'pw',     // Your SQL Server password
    server: 'DESKTOP-6MJKC5D',          // Your SQL Server instance
    database: 'SportGenie',          // The database you created
    options: {
        encrypt: true,            // Required if you're using Azure
        trustServerCertificate: true // Use this for self-signed certificates or localhost
    }
};

// Connect to the database
sql.connect(dbConfig)
    .then(async (pool) => {
        console.log("Connected to the database!");

        // Run a test query
        try {
            const testQuery = await pool.request().query("SELECT 1 AS Test");
            console.log("Database test query result:", testQuery.recordset);
        } catch (queryError) {
            console.error("Error executing test query:", queryError);
        }
    })
    .catch((connectionError) => {
        console.error("Database connection failed:", connectionError);
    });
// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is correctly set in your .env file
});

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log('Incoming request body:', req.body);
    next();
});

app.get('/', (req, res) => {
    res.send('NFL LLM Backend is running!');
});

// Test OpenAI API Route
app.post('/query', async (req, res) => {
    //const { question } = req.body;
    try {
        /*
        const response = await openai.completions.create({
            model: "text-davinci-003",
            prompt: `Parse this question for structured analysis:\n${question}`,
            max_tokens: 100,
        });

        console.log("OpenAI Response:", response.choices[0].text.trim());
        res.json({ answer: response.choices[0].text.trim() });
        */
        const mockAnswer = `Player X has the most touchdowns with 35 touchdowns!`;
        res.json({ answer: mockAnswer });

    } catch (error) {
        console.error("OpenAI Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to process the query." });
    }
});

app.post('/test-openai', async (req, res) => {
    try {
        const response = await openai.ChatCompletion.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Hello, world!" },
            ],
            max_tokens: 100,
        });
        res.json(response.data);
    } catch (error) {
        console.error('OpenAI Error:', error.response?.data || error.message);
        res.status(500).json({ error: "OpenAI request failed." });
    }
});

app.post('/chat', async (req, res) => {
    const { question } = req.body;

    try {
        const schemaDescription = await getSchemaDescription();

        const messages = [
            { role: "system", content: `You are a sports database assistant. Here is the database schema:\n${schemaDescription}` },
            { role: "user", content: `Generate a SQL query to retrieve the answer for the question: "${question}". Ensure the SQL query is enclosed in: \`\`\`sql\nSELECT ...;\n\`\`\`` },
        ];

        // Call OpenAI to generate SQL query
        const sqlResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            max_tokens: 300,
        });

        console.log("OpenAI Full Response:", JSON.stringify(sqlResponse, null, 2));

        const generatedText = sqlResponse.choices?.[0]?.message?.content;
        if (!generatedText) {
            throw new Error("No valid content found in the OpenAI response.");
        }

        // Extract the SQL query
        let sqlQuery = generatedText.match(/```sql([\s\S]*?)```/)[1].trim();

        // Replace `LIMIT` with `TOP` for SQL Server compatibility
        sqlQuery = sqlQuery.replace(/LIMIT\s+(\d+)/gi, (match, p1) => {
            const limitValue = parseInt(p1, 10);
            return `TOP ${limitValue}`;
        });

        // Log the adjusted query for debugging
        console.log("Adjusted SQL Query:", sqlQuery);

        // Execute SQL query
        const queryResult = await sql.query(sqlQuery);
        console.log("SQL Query Result:", queryResult.recordset);

        // Generate final response
        const responseMessages = [
            { role: "system", content: "Based on the following data, create a response:" },
            { role: "user", content: `${JSON.stringify(queryResult.recordset)}` },
        ];

        const finalResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: responseMessages,
            max_tokens: 300,
        });

        res.json({
            answer: finalResponse.choices[0]?.message?.content.trim(),
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message || "Failed to process the query." });
    }
});






const getSchemaDescription = async () => {
    const tablesQuery = `
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE';
    `;
    const tablesResult = await sql.query(tablesQuery);

    let schemaDescription = "The database schema is as follows:\n";
    for (const table of tablesResult.recordset) {
        const columnsQuery = `
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${table.TABLE_NAME}';
        `;
        const columnsResult = await sql.query(columnsQuery);

        schemaDescription += `Table ${table.TABLE_NAME}:\n`;
        columnsResult.recordset.forEach((column) => {
            schemaDescription += `- ${column.COLUMN_NAME} (${column.DATA_TYPE})\n`;
        });
        schemaDescription += "\n";
    }
    return schemaDescription;
};

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
