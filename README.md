# Diagram Studio

**Outils en ligne**: [https://diagramstudio.pages.dev/](https://diagramstudio.pages.dev/)

## Description
Diagram Studio est une application web statique permettant de créer et visualiser des diagrammes professionnels en utilisant trois technologies différentes : Mermaid, PlantUML, et dessin libre. C'est un outil personnel polyvalent pour concevoir des diagrammes UML, des graphiques, des cas d'usage et d'autres schémas visuels.

## Features
- **Zoom and Pan**: Zoom with Ctrl+wheel (adjusted sensitivity) or buttons. Pan by click-dragging when zoomed (>100%). The scene allows moving over the entire image without losing parts. Reset button to return to center.
- **Collapsible Error Console**: The console can be minimized; an indicator appears in case of error.
- **Responsive**: Interface adapted for mobile and tablet, with vertical layout on small screens.
- **Automatic Rendering**: Diagrams update automatically as you type (debounce 300ms).

## Technologies Used
- **HTML5**: Structure of the web page.
- **CSS3**: Responsive layout and modern styles with CSS variables.
- **JavaScript**: Interactive logic, mode management, localStorage saving, image export.
- **Mermaid**: Local JavaScript library for rendering diagrams from text code.
- **PlantUML**: Online service for generating complex UML diagrams (via external API).
- **Pako**: DEFLATE compression library from CDN for PlantUML diagram encoding.
- **Hosting**: Deployed on Cloudflare Pages for fast, global access.

## Comment utiliser
1. Allez sur `https://diagramstudio.pages.dev/` dans un navigateur web.
2. Utilisez les onglets pour basculer entre **Mermaid**, **PlantUML** et **Dessin Libre**.
3. En mode Mermaid ou PlantUML :
   - Saisissez votre code dans la zone de texte.
   - Le rendu se met à jour automatiquement après 300ms d'inactivité.
4. En mode Dessin Libre :
   - Dessinez directement sur le canvas avec la souris.
5. Utilisez le bouton "Télécharger l'image" pour exporter votre diagramme en PNG.

## Sauvegarde des données
Vos codes Mermaid et PlantUML sont automatiquement sauvegardés dans le stockage local du navigateur (`localStorage`) et seront restaurés au prochain chargement.

## Structure des fichiers
- `index.html` : Page principale HTML avec la structure de l'application et l'intégration des bibliothèques (Mermaid locale, Pako depuis CDN).
- `style.css` : Feuille de styles CSS pour l'apparence, la mise en page et le thème de l'application.
- `script.js` : Code JavaScript pour la gestion des modes, le rendu des diagrammes, l'export d'images et la sauvegarde locale.
- `mermaid.min.js` : Bibliothèque Mermaid pour le rendu local des diagrammes Mermaid.
- `README.md` : Ce fichier, documentant le projet.

## Online Version
The application is hosted online at https://diagramstudio.pages.dev/ for easy access without downloading files.

## Local Development
To run locally:
1. Clone this repository.
2. Open `index.html` in a modern web browser (internet required for PlantUML).

## Dépannage
- **Erreur "mermaid is not defined"** : Assurez-vous que `mermaid.min.js` est chargé correctement.
- **Erreur de rendu PlantUML** : Vérifiez votre connexion internet, car PlantUML utilise un service en ligne.
- **Diagrammes ne se mettent pas à jour** : Le rendu est automatique après 300ms d'inactivité dans la zone de texte.