# Markdown Reader

<img alt="Logo Markdown Reader" src="https://raw.githubusercontent.com/md-reader/md-reader/main/src//images/logo-stroke.svg" align="right" width="120">

[English](./README.md) | Français

https://md-reader.github.io

[![](https://badgen.net/chrome-web-store/v/medapdbncneneejhbgcjceippjlfkmkg?icon=chrome&color=607cd2)](https://chromewebstore.google.com/detail/md-reader/medapdbncneneejhbgcjceippjlfkmkg) [![](https://badgen.net/chrome-web-store/stars/medapdbncneneejhbgcjceippjlfkmkg?icon=chrome&color=607cd2)](https://chromewebstore.google.com/detail/md-reader/medapdbncneneejhbgcjceippjlfkmkg) [![](https://badgen.net/chrome-web-store/users/medapdbncneneejhbgcjceippjlfkmkg?icon=chrome&color=607cd2)](https://chromewebstore.google.com/detail/md-reader/medapdbncneneejhbgcjceippjlfkmkg)

Markdown Reader est une extension de navigateur qui permet de prévisualiser facilement des documents Markdown dans le navigateur.

> Ce dépôt contient l'ancien code source de Markdown Reader (version 2.x) et n'est plus maintenu.
> Il sert uniquement à recueillir les tickets concernant Markdown Reader.
>
> Téléchargez la version 3.x depuis le [site web](https://md-reader.github.io).

- **Formats de document** : prévisualisation des liens `file://`, `http://`, `https://` et des fichiers d'extension `.md`, `.mkd`, `.mdx`, `.markdown` :
  - `https://example.com/example.md` (URL Markdown en ligne)
  - `file:///Users/my-project/readme.markdown` (fichier Markdown local, \*[nécessite une autorisation spécifique](#autoriser-laccès-aux-fichiers))
- **Plugins de syntaxe** : émojis, exposants/indices, cases à cocher, formules mathématiques, organigrammes, diagrammes de Gantt, sommaire, insertions, abréviations, notes, alertes.
- **Thèmes** : thèmes clairs et sombres soignés, coloration syntaxique du code.
- **Rechargement à chaud** : prise en compte des modifications du document en temps réel et affichage centré pour une meilleure lecture.
- **Organisation du document** : sommaire dans le panneau latéral, affichage de la source et prise en charge des images.
- **Raccourcis** : accès rapide aux fonctions par les raccourcis clavier de l'extension.

![bannière](./example/example-1.png)

Les styles du thème par défaut se trouvent sur https://github.com/md-reader/theme. Pour les consulter ou les personnaliser, rendez-vous sur ce dépôt et adaptez les fichiers CSS selon vos besoins.

## Installation

### A. Depuis la boutique d'extensions

<a href="https://chromewebstore.google.com/detail/md-reader/medapdbncneneejhbgcjceippjlfkmkg" target="_blank"><img src="./src/images/Chrome.png" style="width:50px"/></a>
<a href="https://microsoftedge.microsoft.com/addons/detail/markdown-reader/djnplooklihmkcioemdjfcednfkpiodc" target="_blank"><img src="./src/images/Edge.png" style="width:50px"/></a>
<a href="https://addons.mozilla.org/firefox/addon/markdown-reader-ext/" target="_blank"><img src="./src/images/Firefox.png" style="width:50px"/></a>
<a href="https://chromewebstore.google.com/detail/md-reader/medapdbncneneejhbgcjceippjlfkmkg" target="_blank"><img src="./src/images/Arc.png" style="width:50px"/></a>

### B. À partir des sources

Exemple avec Chrome :

1. Clonez le dépôt `md-reader` et lancez le build :

   ```bash
   # Cloner ce dépôt
   git clone https://github.com/md-reader/md-reader.git && cd md-reader

   # Installer les dépendances
   pnpm install

   # Construire l'extension
   pnpm build
   ```

2. Une fois le build terminé, le dossier `md-reader/dist` contient le paquet d'extension `md-reader-xxx.zip`.

3. Ouvrez la page de gestion des extensions de Chrome et faites-y glisser l'extension pour l'installer.

## Utilisation

Exemple avec Chrome :

Une fois l'extension installée, Chrome peut prévisualiser les documents Markdown en ligne. Il ne peut en revanche pas prévisualiser les documents Markdown locaux par défaut : il faut d'abord autoriser l'extension à accéder aux fichiers.

### Autoriser l'accès aux fichiers

> Pour des raisons de sécurité, Chrome interdit par défaut aux extensions d'accéder aux fichiers locaux. Après l'installation, vous devez donc activer cette autorisation manuellement pour prévisualiser des fichiers Markdown locaux.

Sur la page de gestion des extensions de Chrome, repérez l'extension « Markdown Reader », cliquez sur « Détails », puis activez l'option « Autoriser l'accès aux URL de fichiers » (« Markdown Reader » se contente de lire et d'afficher les fichiers Markdown : il ne modifie ni n'envoie aucune donnée de vos fichiers).

<br/>

Et voilà, c'est terminé ! ヾ(◍°∇°◍)ﾉ

Essayez avec ce document en ligne : [Document d'exemple](https://raw.githubusercontent.com/md-reader/md-reader/main/example/example.md). Vous pouvez aussi faire glisser un document Markdown directement dans le navigateur !

N'hésitez pas à poser vos questions ou à faire des suggestions.

Une étoile sur le dépôt est aussi un bel encouragement !

## Rejoindre la communauté WeChat

Scannez le code pour suivre les dernières nouvelles et obtenir de l'aide technique :

<img src="./src/images/mp-qrcode.jpg" alt="" style="width:220px"/>

## Licence

Licence [MIT](https://github.com/md-reader/md-reader/blob/main/LICENSE)

© 2018-présent, [Bener](https://github.com/Heroor)
