# README

## Qur’an Journaling App

A private, offline-first Qur’an reflection companion built to help Muslims engage deeply with the Qur’an through journaling, reflection, and structured learning.

This app is designed for beginners and practicing Muslims who want more than passive reading. The goal is to help users build a lasting relationship with the Qur’an through personal reflection (*tadabbur*), understanding, and action.

---

# Vision

Many Muslims read the Qur’an regularly but struggle to:

* Reflect deeply on its meanings
* Remember insights over time
* Connect verses to their daily lives
* Organize their learning and reflections
* Maintain a calm and focused Qur’an study practice

This app exists to solve that problem.

Rather than building another engagement-driven Islamic app, this project focuses on:

* Reflection over consumption
* Depth over distraction
* Privacy over performance
* Simplicity over feature overload

The app is intentionally designed to feel calm, respectful, and focused.

---

# Core Principles

## Private by Default

Your reflections are personal.

The app does not encourage public performance, social validation, or vanity metrics. Notes and reflections are private unless the user explicitly chooses otherwise in future versions.

No:

* Public profiles
* Likes
* Follower systems
* Worship leaderboards
* Social feeds

---

## Offline First

The Qur’an should remain accessible everywhere.

Core functionality works without an internet connection, including:

* Qur’an reading
* Journaling
* Personal notes
* Search
* Basic tafsir access (where bundled locally)

---

## Islamic Integrity

The app clearly separates:

* Scholarly tafsir
* Personal reflection

Tafsir is treated as trusted scholarly material and is never mixed with user-generated interpretation.

Users can write reflections *alongside* tafsir, but not edit tafsir itself.

---

## Simplicity & Focus

The app aims to reduce friction and cognitive overload.

The goal is not to become:

* A social network
* An “Islamic super app”
* A dopamine-driven productivity tracker

Instead, the focus is:

> One ayah at a time. One reflection at a time.

---

# MVP Features

## Qur’an Reader

* Clean reading experience
* Verse-by-verse interaction
* Optimized for focus and readability

## Ayah Reflection

Users can:

* Write private reflections on ayahs
* Edit and organize notes
* Add simple tags such as:

  * reflection
  * action
  * question
  * du'a
  * theme

## Tafsir Layer

* Trusted tafsir sources
* Read-only
* Hide/show toggle
* Clearly separated from personal notes

## Search

* Offline search through personal notes and reflections

## Reflection Prompts

Optional prompts to encourage deeper thinking:

* What does this ayah teach me about Allah?
* What action can I take from this ayah?
* What guidance, warning, or comfort is here?
* What question do I want to study further?

---

# Planned Features

Future features may include:

* Surah-level notes
* Word-level notes
* Qur’an ↔ Hadith linking
* Personal knowledge graph
* Cross-reference system between ayahs and themes
* Optional encrypted sync across devices

These features will only be added if they improve reflection and understanding without compromising simplicity.

---

# Technology Stack

This project is built using a modern cross-platform mobile stack.

* **React Native** — Cross-platform mobile framework
* **Expo** — Native tooling and deployment platform
* **Expo Router** — File-based routing
* **TypeScript** — Type-safe development
* **Async Storage / Local Persistence** — Offline-first journaling
* **React Query** — State and data management
* **Lucide React Native** — Icons

Platform support:

* iOS
* Android
* Web (optional)

---

# Development Philosophy

This project values:

* Maintainable architecture
* Clear separation of concerns
* Reusable components
* Calm and intentional UX
* Long-term sustainability over rapid feature bloat

We prioritize:

* Reliability
* Readability
* Accessibility
* Respectful design

---

# Getting Started

## Requirements

Install:

* Node.js
* Bun

Recommended:

* Cursor
* VS Code
* Claude Code

---

## Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Enter project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
bun install
```

---

# Running the App

## Start Development Server

```bash
bun run start
```

## Run Web Preview

```bash
bun run start-web
```

## Run iOS Simulator

```bash
bun run start -- --ios
```

## Run Android Emulator

```bash
bun run start -- --android
```

---

# Testing on a Physical Device

Install:

* Expo Go for iOS
* Expo Go for Android

Then run:

```bash
bun run start
```

Scan the QR code with Expo Go.

---

# Project Structure

```plaintext
app/                    # Expo Router screens
components/             # Reusable UI components
services/               # Storage and business logic
constants/              # App constants/config
assets/                 # Images/fonts/static assets

app/(tabs)/             # Main navigation
app/_layout.tsx         # Root layout

types/                  # Shared TypeScript types
hooks/                  # Reusable hooks
```

---

# Architectural Direction

The app is structured around a local-first model.

Core entities include:

```ts
UserNote
TafsirEntry
HadithLink
QuranAyah
QuranSurah
```

Notes are linked to:

* Surahs
* Ayahs
* (future) individual words

Business logic should remain separate from UI components where possible.

---

# Deployment

## iOS

```bash
eas build --platform ios
eas submit --platform ios
```

## Android

```bash
eas build --platform android
eas submit --platform android
```

## Web

```bash
eas build --platform web
```

---

# Contributing

Contributions are welcome, especially in:

* UX improvements
* Accessibility
* Qur’an data tooling
* Offline architecture
* Performance optimization
* Islamic research and source verification

Please keep contributions aligned with the project principles:

* Simplicity
* Privacy
* Benefit
* Respectful Islamic design

---

# Important Note

This app is intended to support personal reflection and learning.

It is **not** a source of fatwa or independent religious rulings. Users should refer to qualified scholars for religious verdicts and advanced interpretation matters.

---

# Long-Term Goal

The long-term vision is to help Muslims build a lifelong relationship with the Qur’an:

* through reflection,
* through understanding,
* and through sincere action.

May Allah place benefit in this effort and make it sincerely for His sake. Ameen.
