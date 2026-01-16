# Diagram Studio

## Description
Diagram Studio est une application web statique permettant de créer et visualiser des diagrammes professionnels en utilisant trois technologies différentes : Mermaid, PlantUML, et dessin libre. C'est un outil personnel polyvalent pour concevoir des diagrammes UML, des graphiques, des cas d'usage et d'autres schémas visuels.

## Fonctionnalités
- **Zoom et Pan** : Zoomez avec Ctrl+molette (sensibilité ajustée) ou boutons. Panner en cliquant-glissant quand zoomé (>100%). La scène permet de se déplacer sur toute l'image sans perdre de parties. Bouton Reset pour revenir au centre.
- **Console d'erreurs cachable** : La console peut être réduite ; un indicateur apparaît en cas d'erreur.
- **Responsive** : Interface adaptée pour mobile et tablette, avec layout vertical sur petits écrans.
- **Rendu automatique** : Les diagrammes se mettent à jour automatiquement au fur et à mesure de la saisie (débounce 300ms).

## Technologies utilisées
- **HTML5** : Structure de la page web.
- **CSS3** : Mise en page responsive et styles modernes avec variables CSS.
- **JavaScript** : Logique interactive, gestion des modes, sauvegarde localStorage, export d'images.
- **Mermaid** : Bibliothèque JavaScript pour le rendu de diagrammes à partir de code texte.
- **PlantUML** : Service en ligne pour générer des diagrammes UML complexes (via API externe).
- **Pako** : Bibliothèque de compression DEFLATE pour l'encodage des diagrammes PlantUML.

## Comment utiliser
1. Ouvrez le fichier `index.html` dans un navigateur web moderne.
2. Utilisez les onglets pour basculer entre **Mermaid**, **PlantUML** et **Dessin Libre**.
3. En mode Mermaid ou PlantUML :
   - Saisissez votre code dans la zone de texte.
   - Le rendu se met à jour automatiquement après 500ms d'inactivité.
   - Cliquez sur "Générer le rendu" pour un rendu immédiat.
4. En mode Dessin Libre :
   - Dessinez directement sur le canvas avec la souris.
5. Utilisez le bouton "Télécharger l'image" pour exporter votre diagramme en PNG.

## Sauvegarde des données
Vos codes Mermaid et PlantUML sont automatiquement sauvegardés dans le stockage local du navigateur (`localStorage`) et seront restaurés au prochain chargement.

## Structure des fichiers
- `index.html` : Page principale HTML avec la structure de l'application et l'intégration des bibliothèques externes.
- `style.css` : Feuille de styles CSS pour l'apparence, la mise en page et le thème de l'application.
- `script.js` : Code JavaScript pour la gestion des modes, le rendu des diagrammes, l'export d'images et la sauvegarde locale.
- `README.md` : Ce fichier, documentant le projet.

## Note sur la génération du code
De l'intelligence artificielle a été utilisée pour générer certaines parties du code.