# Diagram Studio

**Outils en ligne sur** [diagramstudio.pages.dev/](https://diagramstudio.pages.dev/)

## Description
Diagram Studio est une application web statique permettant de créer et visualiser des diagrammes professionnels en utilisant trois technologies différentes : Mermaid, PlantUML, et dessin libre. C'est un outil personnel polyvalent pour concevoir des diagrammes UML, des graphiques, des cas d'usage et d'autres schémas visuels.

## Fonctionnalités
- **Zoom et Pan** : Zoom avec Ctrl+molette (sensibilité ajustée) ou boutons. Panoramique par clic-glissement quand zoomé (>100%). La scène permet de se déplacer sur toute l'image sans perdre de parties. Bouton de réinitialisation pour revenir au centre.
- **Console d'erreur repliable** : La console peut être minimisée ; un indicateur apparaît en cas d'erreur.
- **Responsive** : Interface adaptée pour mobile et tablette, avec mise en page verticale sur petits écrans.
- **Rendu automatique** : Les diagrammes se mettent à jour automatiquement pendant la saisie (délai de 300ms).

## Technologies utilisées
- **HTML5** : Structure de la page web.
- **CSS3** : Mise en page responsive et styles modernes avec variables CSS.
- **JavaScript** : Logique interactive, gestion des modes, sauvegarde localStorage, export d'images.
- **Mermaid** : Bibliothèque JavaScript locale pour le rendu des diagrammes à partir de code texte.
- **PlantUML** : Service en ligne pour générer des diagrammes UML complexes (via API externe).
- **Pako** : Bibliothèque de compression DEFLATE depuis CDN pour l'encodage des diagrammes PlantUML.
- **Hébergement** : Déployé sur Cloudflare Pages pour un accès rapide et global.

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
- `sitemap.xml` : Fichier XML pour l'indexation par les moteurs de recherche, listant les URLs du site.
- `robots.txt` : Fichier pour contrôler l'accès des robots d'indexation aux pages du site.
- `README.md` : Ce fichier, documentant le projet.

## Version en ligne
L'application est hébergée en ligne sur https://diagramstudio.pages.dev/ pour un accès facile sans télécharger de fichiers.

## Développement local
Pour exécuter localement :
1. Clonez ce dépôt.
2. Ouvrez `index.html` dans un navigateur web moderne (internet requis pour PlantUML).

## Dépannage
- **Erreur "mermaid is not defined"** : Assurez-vous que `mermaid.min.js` est chargé correctement.
- **Erreur de rendu PlantUML** : Vérifiez votre connexion internet, car PlantUML utilise un service en ligne.
- **Diagrammes ne se mettent pas à jour** : Le rendu est automatique après 300ms d'inactivité dans la zone de texte.