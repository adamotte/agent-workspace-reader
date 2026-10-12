# Agent Workspace Reader

<img alt="Logo Agent Workspace Reader" src="./src/images/logo-stroke.svg" align="right" width="120">

[English](./README.md) | Français

Agent Workspace Reader est une extension de navigateur pour lire des espaces de travail locaux, comme les dossiers où vos agents IA écrivent leurs livrables : elle affiche les fichiers Markdown, texte, JSON et YAML ouverts depuis des URL `file://` et permet de parcourir leurs dossiers depuis un panneau latéral.

Elle reprend [md-reader](https://github.com/md-reader/md-reader) de Bener et fusionne deux de ses forks : [mdsakalu/md-reader](https://github.com/mdsakalu/md-reader) et [mxgnene01/md-reader](https://github.com/mxgnene01/md-reader).

- **Formats de fichier** : affiche les fichiers locaux `.md`, `.mdx`, `.mdc`, `.mkd`, `.markdown` et `.txt`, les fichiers JSON et YAML sous forme de code coloré, et les fichiers sans extension `LICENSE`, `README`, `CHANGELOG` ou `NOTICE` en texte.
- **Navigation dans les dossiers** : le panneau latéral liste le dossier courant avec une icône par type de fichier, trié par nom ou par date de modification. Si un dossier racine est défini, il garde l'arborescence de la racine jusqu'au fichier courant.
- **Liens wiki** : `[[dossier/note|Alias]]` et `[[note]]` pointent vers le fichier local correspondant.
- **Plugins de syntaxe** : émojis, exposants/indices, cases à cocher, formules mathématiques, diagrammes Mermaid et Graphviz, sommaire, insertions, abréviations, notes de bas de page, alertes.
- **Thèmes** : thèmes clairs et sombres, mode de rendu compatible GitHub, coloration syntaxique du code.
- **Rechargement à chaud** : prise en compte des modifications du document en temps réel et affichage centré pour une meilleure lecture.
- **Raccourcis** : affichage du panneau latéral, mise en page centrée, rechargement à chaud et thème au clavier.

![bannière](./example/example-1.png)

Les styles du thème par défaut se trouvent sur https://github.com/md-reader/theme.

## Installation

Agent Workspace Reader n'est pas publiée sur les boutiques d'extensions : construisez-la à partir des sources.

```bash
# Cloner ce dépôt
git clone https://github.com/adamotte/md-reader.git && cd md-reader

# Installer les dépendances
pnpm install

# Construire l'extension
pnpm build
```

L'extension décompressée se trouve dans `extension/` et le paquet `agent-workspace-reader-xxx.zip` dans `dist/`.

Ensuite, dans Chrome ou Edge :

1. Ouvrez `chrome://extensions/` (ou `edge://extensions/`) et activez le mode développeur.
2. Cliquez sur « Charger l'extension non empaquetée » et sélectionnez le dossier `extension/`.

## Utilisation

### Autoriser l'accès aux fichiers

> Pour des raisons de sécurité, Chrome interdit par défaut aux extensions d'accéder aux fichiers locaux : il faut activer cette autorisation après l'installation.

Sur la page de gestion des extensions de Chrome, ouvrez les détails de « Agent Workspace Reader » et activez l'option « Autoriser l'accès aux URL de fichiers ». Agent Workspace Reader se contente de lire et d'afficher vos fichiers : elle ne les modifie ni ne les envoie.

Ouvrez ensuite un fichier ou un dossier local, par exemple `file:///C:/Users/nom/Notes/`, ou faites glisser un fichier Markdown dans le navigateur. Essayez avec [`example/example.md`](./example/example.md) de ce dépôt.

Définissez un dossier racine dans la popup pour garder toute l'arborescence dans le panneau latéral et résoudre les liens wiki courts. [LOCAL_BUILD.md](./LOCAL_BUILD.md) détaille le fonctionnement de la navigation dans les dossiers.

## Licence

[MIT](./LICENSE)

© 2018-présent, [Bener](https://github.com/Heroor) (md-reader)
© 2026-présent, Anthony Damotte (Agent Workspace Reader)
