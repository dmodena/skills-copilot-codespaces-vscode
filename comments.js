// Create web server

const express = require('express');
const bodyParser = require('body-parser');
const {randomBytes} = require('crypto');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create comments array
const commentsByPostId = {};

// Get comments by post id
app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

// Post comments by post id
app.post('/posts/:id/comments', (req, res) => {
    const commentId = randomBytes(4).toString('hex');
    const {content} = req.body;

    // Get comments array by post id
    const comments = commentsByPostId[req.params.id] || [];

    // Push new comment
    comments.push({id: commentId, content, status: 'pending'});

    // Set comments array by post id
    commentsByPostId[req.params.id] = comments;

    // Emit event
    console.log('Emit event');
    axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    });

    // Send response
    res.status(201).send(comments);
});

// Event handler
app.post('/events', (req, res) => {
    console.log('Event received:', req.body.type);

    const {type, data} = req.body;

    if (type === 'CommentModerated') {
        const {id, postId, status, content} = data;

        // Get comments array by post id
        const comments = commentsByPostId[postId];

        // Find comment by id
        const comment = comments.find(comment => {
            return comment.id === id;
        });

        // Set comment status
        comment.status = status;

        // Emit event
        console.log('Emit event');
        axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                postId,
                status,
                content
            }
        });
    }

    res.send({});
});

// Listen port
app.listen(4001, () => {
    console.log('Listening port 4001');
});
