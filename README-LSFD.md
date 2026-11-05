# Borne LSFD – édition améliorée

## Installation
1. Décompresser `Borne-LSFD-LSFD-Edition.zip`.
2. Héberger le dossier `Borne-LSFD-main` sur GitHub Pages ou un serveur web.
3. Ouvrir `index.html` pour consulter la carte, puis `edit.html` pour la modifier.
4. Une connexion internet est nécessaire pour charger Leaflet depuis son CDN.

## Fonctions
- Conservation des 846 emplacements initiaux du fichier `hydrant.json`.
- Marqueurs : bornes rouges, bornes jaunes, casernes et hôpitaux.
- Icônes dédiées aux casernes (camion incendie) et aux hôpitaux (croix médicale).
- Survol des casernes et hôpitaux : nom et commentaire.
- Déplacement des marqueurs par glisser-déposer.
- Clic sur un marqueur : modifier le nom/commentaire ou supprimer.
- Création de zones HAZMAT en polygones par clics successifs, avec nom, couleur et transparence.
- Clic sur une zone HAZMAT : modifier ses propriétés ou la supprimer.
- Filtres d'affichage par catégorie.
- Import/export JSON, compatible avec l'ancien format JSON en tableau.
- Remplacement de l'image de carte depuis l'éditeur. L'image personnalisée est stockée dans IndexedDB du navigateur.

## Important – sauvegarde et partage
Les changements de marqueurs et de zones sont enregistrés dans le stockage local du navigateur. Ils ne sont donc pas automatiquement partagés entre les membres ou les appareils. Utiliser **Exporter JSON** pour sauvegarder/partager les données, puis **Importer JSON** sur un autre navigateur.

L'image de carte personnalisée est elle aussi enregistrée localement dans le navigateur. Pour la publier pour tous les utilisateurs, remplacer `img/map.png` dans le dossier du site par l'image voulue et la déployer. Conserver le même cadrage et les mêmes proportions que la carte d'origine afin que les coordonnées des emplacements restent alignées.

## Utilisation HAZMAT
Cliquer sur « Dessiner une zone HAZMAT », placer au moins trois sommets sur la carte, puis cliquer sur « Terminer le polygone ». Les zones peuvent ensuite être renommées, recolorées, rendues plus ou moins transparentes ou supprimées en cliquant dessus.


## Verrou PIN de l'éditeur
- L'accès à `edit.html` demande un PIN. Le PIN initial est `2468`.
- Avant publication, ouvrez `js/pin-config.js` et remplacez `2468` par votre propre code.
- Le déverrouillage reste actif dans l'onglet courant jusqu'à sa fermeture.
- **Limite de sécurité importante :** GitHub Pages est un hébergement statique public. Un PIN vérifié dans JavaScript peut être retrouvé ou contourné par une personne qui inspecte les fichiers. Ce verrou évite surtout l'accès accidentel ou les modifications par des visiteurs ordinaires ; il ne protège pas réellement contre une personne techniquement avertie. Pour une vraie restriction d'accès, il faut une authentification côté serveur (par exemple Supabase).


## Carte Roxwood County
La carte de fond est intégrée localement dans `img/map.png` (1657 × 2047 px). Les coordonnées des marqueurs de l’ancien fond ont été remises à l’échelle vers les dimensions de cette image.
