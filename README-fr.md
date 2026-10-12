<div align="center">

<img src="./src/images/logo.svg" alt="Logo Agent Workspace Reader" width="96">

# Agent Workspace Reader

**Lisez dans le navigateur les dossiers où travaillent vos agents IA : rapports, plans, mémoire, skills, journaux d'exécution, CSV et code, avec une arborescence et des liens wiki.**

[![Licence : MIT](https://img.shields.io/badge/licence-MIT-blue?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/github/package-json/v/adamotte/agent-workspace-reader?style=flat-square)](package.json)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](src/manifest.json)
[![Chrome | Edge](https://img.shields.io/badge/Chrome%20%7C%20Edge-extension-0078D7?style=flat-square&logo=microsoftedge&logoColor=white)](#-installation)
[![Build](https://img.shields.io/github/actions/workflow/status/adamotte/agent-workspace-reader/build.yml?branch=main&style=flat-square&label=build)](https://github.com/adamotte/agent-workspace-reader/actions/workflows/build.yml)
[![Dernier commit](https://img.shields.io/github/last-commit/adamotte/agent-workspace-reader/main?style=flat-square&label=dernier%20commit)](https://github.com/adamotte/agent-workspace-reader/commits/main)

[English](./README.md) | Français

</div>

![Un audit de dépendances écrit par un agent, affiché avec l'arborescence de son espace de travail et son sommaire](docs/screenshots/hero.png)

Les agents de code et de recherche (Claude Code, Codex, Copilot, Cursor…) laissent leur travail dans de simples fichiers : un `AGENTS.md`, un dossier `memory/`, des fichiers `SKILL.md`, des plans, des rapports, des journaux d'exécution, des traces et des exports CSV. Agent Workspace Reader rend un tel dossier lisible : ouvrez n'importe lequel de ses fichiers depuis une URL `file://` et l'extension l'affiche, avec tout l'espace de travail dans un panneau latéral.

<!-- prettier-ignore -->
> [!NOTE]
> **Local et en lecture seule.** L'extension ne s'exécute que sur les URL `file://` et ne demande aucune autorisation hormis le stockage de ses propres réglages. Elle ne modifie ni n'envoie jamais vos fichiers, et ne charge ni image ni feuille de style distante : ouvrir un document ne contacte jamais un autre hôte. Une image distante ou introuvable est remplacée par son texte alternatif, les badges restent donc lisibles.

---

## ✨ Fonctionnalités

### 📂 Tout l'espace de travail sous la main

- 🌳 **Arborescence** depuis un dossier racine jusqu'au fichier courant, avec ses dossiers parents dépliés et le fichier en surbrillance
- ⚡ **Ouverture sur place** : passer d'un fichier à l'autre dans l'arborescence change de document sans recharger la page, et les boutons précédent et suivant suivent
- 🏷️ **Icône de type** pour chaque fichier, extensions masquées ou affichées, tri par nom ou par date de modification
- 🔗 **Liens wiki** : `[[decisions]]` et `[[skills/write-report/SKILL|write-report]]` pointent vers le fichier correspondant sous la racine
- 🧭 **Sommaire** du document courant, et panneau latéral redimensionnable

### 📝 Le Markdown tel que GitHub l'affiche

- ✅ **Mode compatible GitHub**, actif par défaut : alertes, listes de tâches, tableaux, notes de bas de page, front matter et ancres de titres, avec un bandeau qui liste ce que GitHub afficherait autrement
- 📊 **Diagrammes et formules** : Mermaid (style classique, dessiné à la main ou néo ; disposition dagre ou ELK), Graphviz et KaTeX
- 🧩 **Plugins de syntaxe** : émojis, exposants, insertions, surlignage et conteneurs ; hors mode GitHub, aussi les indices, abréviations, listes de définitions, un sommaire `[[toc]]` et des tableaux étendus
- 📋 **Blocs de code** colorés avec bouton de copie, visionneuse d'images et affichage de la source brute

### 🗂️ Bien plus que du Markdown

![Fichiers CSV, JSON, YAML, Python, journal et image d'un espace de travail d'agent](docs/screenshots/formats.png)

| Type                     | Fichiers                                                                                                             | Affichage                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Markdown                 | `.md` `.mdx` `.mdc` `.mkd` `.markdown`                                                                               | Document mis en forme                            |
| Texte                    | `.txt`, `README`, `LICENSE`, `CHANGELOG`, `NOTICE`, `AUTHORS`, `COPYING`                                             | Document mis en forme                            |
| Données et configuration | `.json` `.yaml` `.yml` `.toml` `.ini` `.cfg` `.conf` `.properties` `.xml`                                            | Code coloré                                      |
| Code                     | `.py` `.js` `.ts` `.sh` `.ps1` `.bat` `.sql` `.go` `.rs` `.java` `.c` `.cpp` `.cs` `.css`…, `Dockerfile`, `Makefile` | Code coloré                                      |
| Journaux                 | `.log`                                                                                                               | Texte brut                                       |
| Tableaux                 | `.csv` `.tsv`                                                                                                        | Tableau, séparateur détecté et modifiable        |
| Médias                   | Images (`.png` `.jpg` `.svg` `.webp`…), vidéo (`.mp4` `.webm`), audio (`.mp3` `.wav` `.flac`…)                       | Visionneuse ou lecteur dans la page              |
| Formats du navigateur    | `.html` `.pdf`                                                                                                       | Visionneuse du navigateur, dans un nouvel onglet |

### 🎨 15 thèmes

![Le même plan dans neuf des quinze thèmes](docs/screenshots/themes.png)

Clair, Sombre, GitHub clair, GitHub sombre, Dracula, Nord, One Dark, Catppuccin Mocha, Rosé Pine, Gruvbox sombre, Tokyo Midnight, Monokai Pro, Solarized sombre, Solarized clair et Synthwave '84, ou **Auto** pour suivre le système. La coloration du code suit le thème.

### 🛋️ Confort de lecture

- 🔄 **Rechargement à chaud** : la page se met à jour pendant que l'agent écrit le fichier
- 📐 **Mise en page centrée** pour les longs documents
- ⌨️ **Raccourcis clavier** pour le panneau latéral, la mise en page, le rechargement à chaud et le thème
- 🌐 Interface en **anglais et en français**

---

## 📦 Installation

Agent Workspace Reader n'est pas encore publiée sur les boutiques d'extensions. Téléchargez `agent-workspace-reader-<date>.zip` depuis la [dernière release](https://github.com/adamotte/agent-workspace-reader/releases/latest) et décompressez-le dans un dossier que vous conserverez, par exemple `agent-workspace-reader/` : l'extension se charge depuis ce dossier. Ensuite, dans Chrome ou Edge :

1. Ouvrez `chrome://extensions/` (ou `edge://extensions/`) et activez le **mode développeur**.
2. Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le dossier décompressé.
3. Ouvrez les **détails** de l'extension et activez **Autoriser l'accès aux URL de fichiers** : par défaut, les navigateurs tiennent les extensions à l'écart des fichiers locaux.

Pour mettre à jour, décompressez la nouvelle release dans le même dossier et cliquez sur le bouton de rechargement de l'extension sur `chrome://extensions/`.

Vous pouvez aussi la [construire à partir des sources](#%EF%B8%8F-développement).

## 🔧 Configuration

<img src="docs/screenshots/popup.png" alt="Fenêtre des réglages" width="250" align="right">

Cliquez sur l'icône de l'extension pour ouvrir ses réglages :

1. **Dossier local racine** : indiquez l'espace de travail de votre agent, par exemple `C:\Users\moi\agents\atlas` ou `/Users/moi/agents/atlas`. Le panneau latéral garde alors l'arborescence depuis cette racine, et les liens wiki courts comme `[[decisions]]` y sont recherchés.
2. **Thème** : choisissez l'un des 15 thèmes, ou Auto.
3. **Actualisation auto**, active par défaut : la page suit un fichier pendant qu'un agent l'écrit.
4. **Compatible GitHub** : désactivez-le pour la syntaxe que GitHub ne prend pas en charge et pour choisir le style et la disposition des diagrammes Mermaid.
5. **Plugins** : activez ou désactivez chaque plugin de syntaxe.
6. **Extensions de fichier**, affichées par défaut dans l'arborescence à côté des icônes de type : désactivez-les pour n'avoir que les noms.

Ouvrez ensuite un fichier ou un dossier, par exemple `file:///C:/Users/moi/agents/atlas/AGENTS.md`, ou faites glisser un fichier dans le navigateur.

Pour essayer, choisissez comme racine le dossier [`example/atlas-workspace`](./example/atlas-workspace) de ce dépôt, l'espace de travail des captures d'écran, et ouvrez son `AGENTS.md`.

[LOCAL_BUILD.md](./LOCAL_BUILD.md) détaille le fonctionnement de la navigation dans les dossiers.

<br clear="right">

## ⌨️ Raccourcis clavier

| Raccourci                                  | Action                                        |
| ------------------------------------------ | --------------------------------------------- |
| <kbd>Alt</kbd>+<kbd>Maj</kbd>+<kbd>B</kbd> | Afficher ou masquer le panneau latéral        |
| <kbd>Alt</kbd>+<kbd>Maj</kbd>+<kbd>C</kbd> | Activer ou désactiver la mise en page centrée |
| <kbd>Alt</kbd>+<kbd>Maj</kbd>+<kbd>R</kbd> | Activer ou désactiver le rechargement à chaud |
| <kbd>Alt</kbd>+<kbd>Maj</kbd>+<kbd>T</kbd> | Basculer entre les thèmes Clair et Sombre     |

Modifiez-les sur `chrome://extensions/shortcuts` (ou `edge://extensions/shortcuts`).

## ⚠️ Limites connues

- **Chromium uniquement** : testée sur Chrome et Edge. Firefox et Safari ne sont pas pris en charge.
- **Dossiers cachés** : l'arborescence ignore les dossiers dont le nom commence par un point, comme `.claude/` ou `.codex/`, ainsi que `node_modules/`. Leurs fichiers s'ouvrent toujours depuis leur URL.
- **Types de fichier inconnus**, comme `.jsonl` : ils n'apparaissent pas dans l'arborescence.
- **Grands tableaux** : l'affichage d'un CSV ou d'un TSV s'arrête aux 5 000 premières lignes.
- **Contenu distant** : les images et feuilles de style distantes ne sont pas chargées, par choix. Les liens vers des pages distantes fonctionnent.
- **Markdown Reader** : si l'extension md-reader d'origine est installée, désactivez-la pour que les deux extensions n'affichent pas la même page.

## 🛠️ Développement

La construction demande Node.js 16 ou plus récent et [pnpm](https://pnpm.io) :

```bash
git clone https://github.com/adamotte/agent-workspace-reader.git
cd agent-workspace-reader
pnpm install
pnpm build
```

L'extension décompressée se trouve dans `extension/`, à charger avec **Charger l'extension non empaquetée** comme à l'[installation](#-installation), et le zip, nommé d'après la version de `package.json`, dans `dist/`.

```bash
pnpm dev                          # construit dans extension/ et reconstruit à chaque modification
pnpm build                        # manifeste, build de production et zip
node --test "tests/*.test.mjs"    # tests unitaires
```

Les tests unitaires importent directement les sources TypeScript, ce qui demande Node.js 22.18 ou plus récent.

Le [workflow Build](.github/workflows/build.yml) lance les tests et le build à chaque push et pull request, et conserve le zip comme artefact du workflow. Chaque commit sur `main` est publié comme une release nommée d'après le jour, par exemple `2026.10.12`, avec le zip en pièce jointe ; une seconde release le même jour reçoit le hash court du commit en suffixe, par exemple `2026.10.12-4a6cac3`.

## 🙏 Remerciements

Agent Workspace Reader reprend [md-reader](https://github.com/md-reader/md-reader), dont le thème par défaut se trouve sur [md-reader/theme](https://github.com/md-reader/theme), et fusionne deux de ses forks :

- [mdsakalu/md-reader](https://github.com/mdsakalu/md-reader) : rendu compatible GitHub, assainissement par DOMPurify, Mermaid 12 et les thèmes supplémentaires
- [mxgnene01/md-reader](https://github.com/mxgnene01/md-reader) : la navigation dans les dossiers locaux et les liens wiki

## 📄 Licence

[MIT](./LICENSE)
