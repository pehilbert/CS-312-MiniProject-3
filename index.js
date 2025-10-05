const express = require('express');
const pg = require('pg');
const { format } = require('date-fns');

// Globals
const PORT = 80;

let posts = [];
let currentId = 0;

const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'BlogsDB',
    password: 'password',
    port: 5432,
});

db.connect();

// Initialize express
const app = express();

// Initialize EJS
app.set('view engine', 'ejs');

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes

// Main page
app.get('/', (req, res) => {
    db.query('SELECT * FROM blogs', (err, result) => {
        if (err) {
            console.error(err);
            return res.render('pages/error', { message: 'Database error' });
        }

        const dbPosts = result.rows.map(row => ({
            id: row.blog_id,
            author: row.creator_name,
            title: row.title,
            content: row.body,
            category: row.category,
            timestamp: format(new Date(row.date_created), 'MMMM d, yyyy hh:mm a')
        }));

        if (req.query && req.query.filter) {
            const filteredPosts = dbPosts.filter(post => post.category === req.query.filter);
            return res.render('index', { posts: filteredPosts, filter: req.query.filter });
        }

        res.render('index', { posts: dbPosts });
    });
});

// Edit post form
app.get('/edit', (req, res) => {
    const post = posts.find(post => post.id === parseInt(req.query.id));

    if (!post) {
        return res.status(404).render('pages/error', { message: 'Post to edit not found' });
    }

    res.render('pages/edit', post);
});

// Delete post confirmation page
app.get('/delete', (req, res) => {
    const post = posts.find(post => post.id === parseInt(req.query.id));

    if (!post) {
        return res.status(404).render('pages/error', { message: 'Post to delete not found' });
    }

    res.render('pages/delete', post);
});

// Sign up page
app.get('/signup', (req, res) => {
    res.render('pages/signup');
});

// Login page
app.get('/login', (req, res) => {
    res.render('pages/login');
});

// Create post logic
app.post('/create', (req, res) => {
    const { author, title, content, category } = req.body;

    if (author && title && content, category) {
        const newPost = {
            id: ++currentId,
            author,
            title,
            content,
            category,
            timestamp: format(new Date(), 'MMMM d, yyyy hh:mm a')
        };
        posts.push(newPost);
        res.redirect('/');
    } else {
        res.status(400).send('All fields are required.');
    }
});

// Edit post logic
app.post('/edit', (req, res) => {
    const { id, author, title, content, category } = req.body;
    const postIndex = posts.findIndex(post => post.id === parseInt(id));
    posts[postIndex] = { ...posts[postIndex], author, title, content, category };
    res.redirect('/');
});

// Delete post logic
app.post('/delete', (req, res) => {
    posts = posts.filter(post => post.id !== parseInt(req.body.id));
    res.redirect('/');
});

// Start app
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});