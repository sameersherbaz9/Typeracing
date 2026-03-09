-- TypeRacing Database Schema
-- Run this file to initialize the database

CREATE DATABASE IF NOT EXISTS typeracing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE typeracing;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(10) DEFAULT '🏎️',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Texts Table
CREATE TABLE IF NOT EXISTS Texts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  language ENUM('english', 'urdu', 'coding') DEFAULT 'english'
);

-- Races Table
CREATE TABLE IF NOT EXISTS Races (
  race_id INT AUTO_INCREMENT PRIMARY KEY,
  text_id INT,
  status ENUM('waiting', 'countdown', 'active', 'finished') DEFAULT 'waiting',
  room_code VARCHAR(10) NOT NULL UNIQUE,
  is_private BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (text_id) REFERENCES Texts(id),
  FOREIGN KEY (created_by) REFERENCES Users(id)
);

-- RaceParticipants Table
CREATE TABLE IF NOT EXISTS RaceParticipants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  race_id INT NOT NULL,
  user_id INT NOT NULL,
  wpm DECIMAL(6,2) DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  finish_time INT DEFAULT NULL,
  position INT DEFAULT NULL,
  FOREIGN KEY (race_id) REFERENCES Races(race_id),
  FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Leaderboard Table
CREATE TABLE IF NOT EXISTS Leaderboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  best_wpm DECIMAL(6,2) DEFAULT 0,
  avg_accuracy DECIMAL(5,2) DEFAULT 0,
  total_races INT DEFAULT 0,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- =============================
-- SEED DATA: English Texts
-- =============================

INSERT INTO Texts (content, difficulty, language) VALUES
-- Easy
('The quick brown fox jumps over the lazy dog. A simple sentence that contains every letter of the alphabet.', 'easy', 'english'),
('Practice makes perfect. The more you type, the faster and more accurate you will become over time.', 'easy', 'english'),
('Learning to type quickly is a valuable skill in the modern world. Start slow and build up your speed gradually.', 'easy', 'english'),
('The sun rises in the east and sets in the west. This is a fact that has remained true since the dawn of time.', 'easy', 'english'),
('A journey of a thousand miles begins with a single step. Every great achievement starts with the decision to try.', 'easy', 'english'),

-- Medium
('Technology has transformed the way we communicate, work, and learn. From smartphones to artificial intelligence, innovation continues to reshape our daily lives in profound ways.', 'medium', 'english'),
('The human brain is capable of remarkable things. It processes information, forms memories, and adapts to new experiences throughout our entire lives, making us uniquely flexible learners.', 'medium', 'english'),
('Climate change is one of the most pressing challenges of our time. Scientists around the world are working tirelessly to develop sustainable solutions that can protect our planet for future generations.', 'medium', 'english'),
('Software development is both an art and a science. Writing clean, efficient code requires creativity, logical thinking, and a deep understanding of the tools and languages at your disposal.', 'medium', 'english'),
('The internet has connected billions of people across the globe. Information flows freely across borders, enabling collaboration, education, and commerce on an unprecedented scale.', 'medium', 'english'),

-- Hard
('Quantum computing leverages the principles of superposition and entanglement to perform computations exponentially faster than classical computers, potentially revolutionizing cryptography, drug discovery, and optimization problems that currently seem intractable.', 'hard', 'english'),
('The philosophical debate between empiricism and rationalism centers on whether knowledge is primarily derived from sensory experience or whether certain truths can be known through reason alone, independent of observation.', 'hard', 'english'),
('Neuroplasticity refers to the brain''s ability to reorganize itself by forming new neural connections throughout life, allowing neurons to compensate for injury, disease, or behavioral changes in response to new experiences or environmental stimuli.', 'hard', 'english'),
('The development of large language models represents a paradigm shift in artificial intelligence, enabling machines to generate coherent text, translate languages, write code, and perform complex reasoning tasks with unprecedented accuracy and versatility.', 'hard', 'english'),
('Cryptographic hash functions are mathematical algorithms that map data of arbitrary size to a fixed-size output, providing the foundation for digital signatures, password storage, blockchain technology, and data integrity verification systems.', 'hard', 'english'),

-- Coding texts
('function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); } console.log(fibonacci(10));', 'medium', 'coding'),
('const fetchData = async (url) => { try { const response = await fetch(url); const data = await response.json(); return data; } catch (error) { console.error(error); } };', 'medium', 'coding'),
('SELECT users.username, COUNT(races.race_id) as total_races FROM users LEFT JOIN race_participants ON users.id = race_participants.user_id GROUP BY users.id ORDER BY total_races DESC;', 'hard', 'coding'),
('class Stack { constructor() { this.items = []; } push(element) { this.items.push(element); } pop() { return this.items.pop(); } peek() { return this.items[this.items.length - 1]; } }', 'medium', 'coding'),
('import React, { useState, useEffect } from "react"; const App = () => { const [data, setData] = useState(null); useEffect(() => { fetchData().then(setData); }, []); return <div>{data}</div>; };', 'hard', 'coding'),

-- Urdu (transliterated) texts
('Zindagi ek safar hai, jis mein har qadam ek naya tajurba lekar aata hai. Himmat aur hausla hi kamyabi ki kunji hain.', 'easy', 'urdu'),
('Ilm haasil karna har insaan ka haq hai. Parhai se hi hum apni zindagi behtar bana sakte hain aur apne sapnon ko pura kar sakte hain.', 'medium', 'urdu'),
('Waqt ki qadr karo, kyunki gaya waqt kabhi wapas nahi aata. Har lamhe ko qeemat do aur apni zindagi ko maqsad ke saath jiyo.', 'medium', 'urdu');

-- Create indexes for performance
CREATE INDEX idx_races_status ON Races(status);
CREATE INDEX idx_participants_race ON RaceParticipants(race_id);
CREATE INDEX idx_participants_user ON RaceParticipants(user_id);
CREATE INDEX idx_leaderboard_wpm ON Leaderboard(best_wpm DESC);
