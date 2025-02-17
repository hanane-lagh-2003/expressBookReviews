const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

public_users.post('/register', function (req, res) {
    const { username, password } = req.body; // Récupérer username et password depuis le corps de la requête

    // Vérifier si le nom d'utilisateur et le mot de passe sont fournis
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Vérifier si le nom d'utilisateur existe déjà
    const userExists = users.some(user => user.username === username);

    if (userExists) {
        return res.status(400).json({ message: 'Username already exists.' });
    }

    // Créer un nouvel utilisateur
    const newUser = { username, password }; // Ajouter d'autres champs si nécessaire (par exemple, email, etc.)

    // Ajouter l'utilisateur à la liste des utilisateurs (par exemple, stocker dans une base de données)
    users.push(newUser); // Ceci est une simulation en mémoire, à remplacer par une solution persistante (ex : base de données)

    // Répondre avec un message de succès
    res.status(201).json({ message: 'User registered successfully.' });
});
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    
    // Use Axios with Promise to fetch book details by ISBN
    axios.get(`http://localhost:5000/book/${isbn}`) // Assuming your book detail endpoint is '/book/:isbn'
        .then(response => {
            // Successfully fetched the book details
            res.status(200).send(JSON.stringify(response.data, null, 4));
        })
        .catch(error => {
            // Handle error if the request fails
            res.status(500).json({ message: 'Error fetching book details', error: error.message });
        });
});
public_users.get('/', function (req, res) {
    // Use Axios with Promise to fetch the book list
    axios.get('http://localhost:5000/books') // Assuming the books API endpoint is at '/books'
        .then(response => {
            // Successfully fetched the list of books
            res.status(200).send(JSON.stringify(response.data, null, 4));
        })
        .catch(error => {
            // Handle error if the request fails
            res.status(500).json({ message: 'Error fetching book list', error: error.message });
        });
});
// Get the book list available in the shop
public_users.get('/', function (req, res) {
    // Vérifiez si books contient des données et renvoyez-les
    if (books && books.length > 0) {
      res.status(200).send(JSON.stringify(books, null, 4));
    } else {
      res.status(404).json({ message: 'No books found' });
    }
  });


// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;

    const book = books.find(b => b.isbn === isbn);

    if (book) {
        res.status(200).json(book);
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});
public_users.post('/review/:isbn', function (req, res) {
    const { isbn } = req.params; // ISBN du livre
    const { review } = req.query; // La critique envoyée via la requête query

    // Vérifier si la critique est fournie dans la requête
    if (!review) {
        return res.status(400).json({ message: 'Review is required.' });
    }

    // Vérifier si l'utilisateur est connecté (token dans la session)
    const token = req.session.token;
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    // Décoder le token JWT pour obtenir les informations de l'utilisateur
    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Access Denied: Invalid token' });
        }

        const username = decoded.username; // Nom d'utilisateur obtenu du token

        // Chercher le livre correspondant à l'ISBN
        const book = books.find(b => b.isbn === isbn);

        if (!book) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        // Vérifier si un utilisateur a déjà posté une critique pour ce livre
        const existingReviewIndex = book.reviews.findIndex(review => review.username === username);

        if (existingReviewIndex !== -1) {
            // Si la critique existe déjà, la modifier
            book.reviews[existingReviewIndex].review = review;
            return res.status(200).json({ message: 'Review updated successfully' });
        } else {
            // Si la critique n'existe pas, l'ajouter
            book.reviews.push({ username: username, review: review });
            return res.status(201).json({ message: 'Review added successfully' });
        }
    });
});
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author;

    // Use Axios with Promise to fetch book details by author
    axios.get(`http://localhost:5000/books?author=${author}`) // Assuming your books endpoint filters by author
        .then(response => {
            // Successfully fetched the book details
            res.status(200).send(JSON.stringify(response.data, null, 4));
        })
        .catch(error => {
            // Handle error if the request fails
            res.status(500).json({ message: 'Error fetching books by author', error: error.message });
        });
});
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;

    // Use Axios with Promise to fetch book details by title
    axios.get(`http://localhost:5000/books?title=${title}`) // Assuming your books endpoint filters by title
        .then(response => {
            // Successfully fetched the book details
            res.status(200).send(JSON.stringify(response.data, null, 4));
        })
        .catch(error => {
            // Handle error if the request fails
            res.status(500).json({ message: 'Error fetching books by title', error: error.message });
        });
});
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params; // ISBN du livre
    const token = req.session.token; // Récupérer le token de session

    // Vérifier si l'utilisateur est connecté (token dans la session)
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    // Décoder le token JWT pour obtenir les informations de l'utilisateur
    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Access Denied: Invalid token' });
        }

        const username = decoded.username; // Nom d'utilisateur obtenu du token

        // Chercher le livre correspondant à l'ISBN
        const book = books.find(b => b.isbn === isbn);

        if (!book) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        // Trouver l'index de la critique de l'utilisateur pour ce livre
        const reviewIndex = book.reviews.findIndex(review => review.username === username);

        if (reviewIndex === -1) {
            return res.status(404).json({ message: 'Review not found for this book' });
        }

        // Supprimer la critique
        book.reviews.splice(reviewIndex, 1);

        return res.status(200).json({ message: 'Review deleted successfully' });
    });
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author;

    const booksByAuthor = books.filter(b => b.author.toLowerCase() === author.toLowerCase());
    if (booksByAuthor.length > 0) {
        res.status(200).json(booksByAuthor);
    } else {
        res.status(404).json({ message: 'No books found for this author' });
    }
});


// Get all books based on title
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;

    const booksByTitle = books.filter(b => b.title.toLowerCase().includes(title.toLowerCase()));

    if (booksByTitle.length > 0) {
        res.status(200).json(booksByTitle);
    } else {
        res.status(404).json({ message: 'No books found for this title' });
    }
});


//  Get book review
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;

    const book = books.find(b => b.isbn === isbn);

    if (book) {
        if (book.reviews && book.reviews.length > 0) {
            res.status(200).json(book.reviews);
        } else {
            res.status(404).json({ message: 'No reviews found for this book' });
        }
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});

public_users.post('/login', function (req, res) {
    const { username, password } = req.body; // Récupérer les informations d'identification de la requête

    // Vérifier si le nom d'utilisateur et le mot de passe sont fournis
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Chercher l'utilisateur correspondant dans le tableau 'users'
    const user = users.find(user => user.username === username);

    // Vérifier si l'utilisateur existe et si le mot de passe est correct
    if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Si les informations d'identification sont correctes, générer un token JWT
    const token = jwt.sign({ username: user.username }, 'your_secret_key', { expiresIn: '1h' });

    // Enregistrer le token dans la session
    req.session.token = token;

    // Répondre avec le token JWT
    res.status(200).json({ message: 'Login successful', token });
});

module.exports.general = public_users;
