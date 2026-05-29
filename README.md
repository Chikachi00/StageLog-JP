<div align="right">

[![English](https://img.shields.io/badge/English-007ACC?style=for-the-badge)](./README.md)
[![中文](https://img.shields.io/badge/中文-FF5555?style=for-the-badge)](./README.zh-CN.md)

</div>

# StageLog JP

A personal live event archive web app for anime, idol, and live concert fans in Japan.

StageLog JP helps users record their live event experiences with ticket-style cards, venue information, seat details, automatic weather matching, and attendance statistics.

## Preview

> Screenshots will be added here.

## Features

### Event Archive

Users can create and manage live event records with:

- Event title
- Artist / performer
- Date and time
- Venue
- City / country
- Ticket type
- Seat information
- Notes and memories
- Event images

### Ticket-Style UI

Each event is displayed as a ticket-like card inspired by real live concert ticket stubs.

The card includes:

- Event name
- Artist name
- Venue
- Seat information
- Date
- Category tag
- Decorative barcode style

### Year and Artist Filters

Users can filter events by:

- Year
- Artist
- Venue
- Event type

This makes it easier to browse and organize past live event experiences.

### Automatic Weather Matching

StageLog JP can automatically match weather data based on:

- Event date
- Venue location
- Event time

The web app stores weather information such as:

- Temperature
- Rainfall
- Wind speed
- Weather condition

This allows users to remember what the weather was like on the day of each live event.

### Weather Ranking

The app can generate personal live event weather rankings, such as:

- Hottest live event
- Coldest live event
- Rainiest live event
- Windiest live event

### Venue Seat Visualization

For supported venues, StageLog JP can display a simplified venue map and mark the user's seat position.

Planned supported venues include:

- Tokyo Dome
- Belluna Dome
- K-Arena Yokohama
- Pia Arena MM
- Yokohama Arena
- Zepp Haneda

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Open-Meteo API
- SVG-based venue maps

## Project Goals

This project is designed as both a personal tool and a portfolio project.

The goal is to build a practical web app for Japanese live event fans while demonstrating frontend development, data modeling, API integration, UI design, and data visualization skills.

## Roadmap

### Version 1

- Add, edit, and delete event records
- Ticket-style event card UI
- Year filter
- Artist filter
- Venue filter
- Manual seat information input
- Automatic weather matching

### Version 2

- Weather ranking page
- Artist statistics
- Venue statistics
- Event image upload
- Improved mobile UI

### Version 3

- SVG venue maps
- Seat position visualization
- Multiple attendance records on the same venue map
- Support for major Japanese venues

### Version 4

- Ticket lottery management
- Winning / losing result tracking
- Payment status
- Ticket issuing status
- Companion management

## Why I Built This

As a fan of Japanese anime and idol live events, I wanted to create a tool that could preserve not only basic event information, but also the small details that make each live experience memorable.

Existing note-taking apps are too general, while ticketing apps do not focus on personal memories and long-term statistics.

StageLog JP combines live event records, ticket-style design, weather data, and venue visualization into one personal archive.

## License

MIT License
