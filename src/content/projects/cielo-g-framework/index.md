---
kind: project
featured: true
title: "CIELO-G Learning Framework"
description: "An open-source modular gamification framework for Godot 4 that enables rapid creation of educational mini-games with built-in progress tracking and certificate generation."
topic: ""
publishDate: "28 Aug 2025"
updatedDate: ""
coverImage:
  src: "./cover.png"
  alt: "CIELO-G Learning Framework cover"
thumbnail:
  src: "./cover.png"
  alt: "CIELO-G Learning Framework thumbnail"
tags: []
---

## Overview

The **CIELO-G Learning Framework** is a flexible, plug-and-play framework for Godot 4 that empowers educators and developers to rapidly create educational mini-games. Designed with modularity at its core, the framework provides three extensible game systems, automatic progress tracking, certificate generation, and a rich dialogue system—all without requiring advanced programming knowledge.

::github{repo="arthifact/CIELO-G-Learning-Framework"}

:::tip[Try it Live]
See the framework in action at the [CIELO-G Learning App](https://cielo-g.github.io/courses/)
:::

## Background

Developed as part of an **NSF-funded research initiative** at the CIELO-G Lab (The University of Texas at El Paso), this framework addresses a critical gap in Earth-science education: the absence of modular, reusable gamification tools that can be easily adapted by educators without extensive technical expertise.

Under the mentorship of **Dr. Aaron Velasco**, **Dr. Katalina Salas**, and **PhD candidate Marc Garcia**, I architected this framework to reduce educational game development time from weeks to hours through scene inheritance patterns and plug-and-play architecture.

## The Challenge

Creating educational games typically requires:

- Extensive programming knowledge
- Custom implementation of common features (scoring, progress tracking, feedback)
- Significant time investment for each new game
- Lack of standardization across different educational modules

:::important
The CIELO-G Learning Framework solves these challenges by providing reusable, inheritance-based game systems that educators can customize with their own content.
:::

---

## Architecture Design

I engineered the complete software architecture following modular design patterns in Godot 4 (GDScript):

### Core Systems

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ModuleManager** | Flow orchestration | State machine logic, attempt analytics, retry management |
| **TransitionManager** | Scene management | Shader-based transitions, visual effects |
| **MenuBar Component** | User interface | Real-time progress, contextual navigation |

### Game Systems

I designed **four extensible game systems** with inheritance-based architecture:

#### 1. Explanation System
**Narrative-driven content delivery** with rich text formatting and character expression states

```gdscript
var dialogue_items: Array[Dictionary] = [
    {
        "expression": expressions["happy"],
        "text": "Welcome to the learning module!",
        "character": bodies["kat"]
    }
]
```

#### 2. Clickable System
**Interactive selection elements** for formative assessment (multiple choice, true/false)

```gdscript
@export var is_correct: bool = false  # Mark as correct answer
```

#### 3. Drag-and-Drop System
**Spatial reasoning tasks** with kinematic validation (sorting, categorization, placement)

```gdscript
@export var draggables_inside: Array[Area2D] = []  # Expected objects
```

#### 4. Mix-and-Match System
**Graph-based relationship mapping** for concept association (connecting pairs, network diagrams)

```gdscript
@export var answers: Array[Area2D] = []      # Correct connections
@export var max_outgoing: int = 1            # Max connections from this
@export var max_incoming: int = 1            # Max connections to this
```

---

## Key Features

### 🎯 Modular Game Systems

- Three base systems (Clickable, Drag-and-Drop, Mix-and-Match) that can be inherited and customized
- Plug-and-play architecture: create minigames in Play by inheriting from base systems
- Assets folder structure for organized game-specific resources

### 📊 Built-in Progress Tracking

- Automatic attempt counting and analytics
- First-try success metrics
- Retry functionality with certificate qualification logic
- Real-time progress indicators

### 🎓 Certificate Generation

- Evidence-based mastery learning system
- **Criteria**: 100% first-attempt success, zero retries
- Performance-based feedback reinforcing learning retention
- Player name customization

### 🎨 Rich Learning Experience

- Explanation/dialogue system with multiple character support
- Character expression states (_happy, sad, angry, regular_)
- Rich text formatting (**wave**, _shake_, ~~rainbow~~ effects)
- Slide support for instructional content
- Shader-based scene transitions

### 🔧 Developer-Friendly

- Clean, modular codebase with consistent commenting style
- Comprehensive documentation and API guides
- Scene inheritance patterns for rapid prototyping
- Standardized folder structure

## Project Structure

```
CIELO-G_Learning_Framework/
├── Global/                    # Shared resources and scripts
│   ├── Assets/               # Fonts, audio, characters, themes
│   └── Scripts/              
│       ├── Managers/         # Core game management (ModuleManager)
│       ├── SetName/          # Player name input
│       ├── ThankYou/         # Completion screens
│       └── Transitions/      # Scene transition effects
│
├── Menu/                      # Main menu and navigation
│   ├── Home/                 # Home screen with play/learn buttons
│   └── MenuBar/              # Progress bar and navigation
│
├── Module/                    # Learning module components
│   ├── Learn/                # Explanation/dialogue system
│   ├── Certificate/          # Certificate generation
│   └── Play/                 # 👉 YOUR MINIGAMES GO HERE!
│       ├── Minigame_1/       # First minigame folder
│       │   ├── Assets/       # Minigame-specific visuals
│       │   └── minigame_1.tscn
│
├── S_Clickable/              # 🎯 Clickable game system (BASE)
│   ├── ClickableSystem.tscn  # Inherit from this
│   └── Prefabs/              
│
├── S_DragAndDrop/            # 🎯 Drag-and-drop game system (BASE)
│   ├── DragAndDropSystem.tscn
│   └── Prefabs/              
│
└── S_MixAndMatch/            # 🎯 Mix-and-match game system (BASE)
    ├── MixAndMatchSystem.tscn
    └── Prefabs/              
```

---

## Results & Impact

### Open Source Publication

- Published on GitHub with **MIT License** for worldwide educational use
- Comprehensive documentation including README, API guides, and architectural diagrams
- Enables scalable adoption by educators and researchers globally

### Development Efficiency

:::important[Key Metric]
**Reduces game development time from weeks to hours** through reusable systems
:::

- Educators can create new lessons by simply inheriting scenes and adding content
- No advanced programming required—focus on content, not code

### Research Contribution

- Contributes to ongoing research on gamification's impact on learner motivation in STEM education
- Provides foundation for measuring learning retention through mastery-based criteria
- Demonstrates domain-agnostic approach applicable beyond Earth science

### Educational Applications

| Feature | Benefit |
|---------|---------|
| Classroom-ready | Immediate deployment without setup |
| Formative assessment | Interactive elements for checking understanding |
| Narrative pedagogy | Story-driven learning through dialogue systems |
| Measurable outcomes | Progress analytics and certificate generation |

---

## Technical Challenges & Solutions

### Challenge 1: Creating a Truly Modular System

**Problem**: How to make game systems work across different game types while maintaining consistency?

**Solution**: Implemented inheritance-based architecture where all games share core manager logic but customize gameplay through scene overrides

```gdscript title="Inheritance pattern"
# All systems inherit from the same manager
# But customize through exported variables and scene composition
```

### Challenge 2: Progress Tracking Across Minigames

**Problem**: How to track player progress across multiple minigames and potentially multiple sessions?

**Solution**: Centralized `ModuleManager` singleton with state persistence and attempt analytics

```gdscript title="ModuleManager.gd" {3-6}
# Tracking attempts/results
var _attempts: Dictionary = {}     # scene_path -> attempts count
var _used_retry: bool = false      # any retry pressed?
var _first_try_successes: int = 0  # perfect first attempts
var _completed: int = 0            # finished minigames
```

### Challenge 3: Accessibility for Non-Programmers

**Problem**: How to make the framework accessible to educators without programming backgrounds?

**Solution**: Designed intuitive folder structure, export variables for configuration, and comprehensive documentation

:::tip[Design Philosophy]
If an educator can organize files in folders and fill in text boxes, they can create a complete learning module.
:::

---

## Customization Guide

### Adding Characters

1. Place character images in Characters
2. Add to ExplanationSystem.gd:

```gdscript title="ExplanationSystem.gd" ins={4}
var bodies := {
    "kat":    preload("res://Global/Assets/Characters/kat.png"),
    "sophia": preload("res://Global/Assets/Characters/sophia.png"),
    "new_character": preload("res://Global/Assets/Characters/new.png"),
}
```

### Adding Expressions

1. Place expression images in Expressions
2. Reference in dialogue items:

```gdscript
{
    "expression": expressions["happy"],
    "text": "I'm feeling great!",
    "character": bodies["kat"]
}
```

### Custom Themes

Modify themes in Theme:
- `explanation.theme` - Learning module theme
- `mini_menu.theme` - Menu bar theme

:::caution[Theme Compatibility]
Ensure your custom themes maintain contrast ratios for accessibility compliance.
:::

---

## Future Enhancements

- [ ] Additional game system templates (Quiz, Timeline, Memory Match)
- [ ] Multiplayer support for collaborative learning
- [ ] Advanced analytics dashboard for educators
- [ ] Save/load system for persistent progress across sessions
- [ ] Localization support for international adoption
- [ ] Mobile touch optimization
- [ ] Accessibility features (screen reader, colorblind modes)

:::note[Community Contributions]
Interested in contributing? Check out the [GitHub Issues](https://github.com/arthifact/CIELO-G-Learning-Framework/issues) for feature requests and bugs!
:::

---

## Lessons Learned

Throughout this project, I gained valuable insights:

**Modularity is key**: Designing for extensibility from the start pays dividends when users want to customize

**Documentation matters**: Clear guides and examples dramatically increase adoption rates

**Research context**: Understanding pedagogical principles improved design decisions throughout development

**Open source impact**: Publishing with comprehensive documentation enables community contributions and wider reach

**User testing**: Early feedback from educators shaped the final architecture significantly

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Engine** | Godot 4 |
| **Language** | GDScript |
| **Architecture** | Singleton pattern, State machine, Scene inheritance |
| **Shaders** | Custom GLSL for transitions and visual effects |
| **Version Control** | Git, GitHub |
| **Documentation** | Markdown, inline code comments |
| **Design** | Modular design patterns, OOP principles |

---

## Links & Resources

- 📦 [GitHub Repository](https://github.com/arthifact/CIELO-G-Learning-Framework)
- 📖 [Full Documentation](https://github.com/arthifact/CIELO-G-Learning-Framework#readme)
- 🎮 [CIELO-G Learning App](https://cielo-g.github.io/courses/) (Framework in action)
- 🔬 [NSF-Funded CIELO-G Lab, UTEP](https://www.cielog.org/)
- 🐛 [Report Issues](https://github.com/arthifact/CIELO-G-Learning-Framework/issues)

---

## Acknowledgments

This project was made possible through:

- **NSF Funding**: Supporting innovative educational technology research
- **CIELO-G Lab**: Providing resources and research environment
- **Mentorship**: Dr. Aaron Velasco, Dr. Katalina Salas, and PhD candidate Marc Garcia
- **Godot Community**: Open-source engine enabling rapid development
- **Kenney.nl**: Audio assets used in the framework

:::tip[Citing This Work]
If you use this framework in your research or educational materials, please cite:
```
Alonso, G. (2025). CIELO-G Learning Framework: A Modular Gamification Platform for Educational Games. 
GitHub. https://github.com/arthifact/CIELO-G-Learning-Framework
```
:::

---

**Project Timeline**: August 2025 - Present  
**Role**: Lead Developer & Architect  
**Organization**: NSF-Funded CIELO-G Lab, UTEP  
**License**: MIT (Open Source)  
**Status**: Active development, v1.0 released
