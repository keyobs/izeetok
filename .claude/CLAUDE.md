## Projet

**EuroMillions Geometry Lab** (izeetok) — SPA React qui traite les grilles/tirages EuroMillions
comme des objets mathématiques (features, géométrie, PCA/UMAP, clustering, backtesting), sans
jamais suggérer une capacité prédictive. Roadmap en 4 versions, voir `devdx/specs_v{1..4}.md` :
V1 analyse une grille, V2 teste une hypothèse (backtest), V3 construit l'univers mathématique
(embeddings/discovery), V4 permet de le visualiser en 3D (`/eurospace`).

Décisions d'architecture actées, voir `docs/adr/` :
- **ADR-0001** : aucun backend — SPA 100% client-side (déployée sur Vercel), dataset de tirages en
  CSV committé (source FDJ), état utilisateur en `localStorage`.
- **ADR-0002** : on construit d'abord un spike vertical (`Grid → FeatureExtractor →
  GeometryDescriptor → PCA → coordonnées shape SpatialEmbedding → point cloud three.js`) avant de
  bâtir V1 à V4 en entier — ça valide le contrat `SpatialEmbedding` (V3) que V4 consomme, avant
  d'investir dans les pages complètes.

Vocabulaire du domaine (Grid, Draw, FeatureVector, GeometryDescriptor, SpatialEmbedding,
DiscoveryModel, Family, Strategy, Experiment, TemporalWindow, les 4 scores...) : voir `CONTEXT.md`
à la racine. Le principe non-négociable répété dans chaque spec : toutes les combinaisons ont la
même probabilité théorique ; l'app analyse des structures historiques, elle ne prédit rien.

## Périmètre

Repo à plat (pas de monorepo `apps/`) : je lis et j'écris dans tout le repo — `src/`, `public/`,
`docs/`, racine. `devdx/` (specs sources) reste ignoré par git mais en lecture libre pour le
contexte. `.claude/` et `.agents/` sont versionnés (outillage agentique partagé avec l'équipe :
`CLAUDE.md`, `.claude/agents/`, `.agents/workflows/`, skills).

Process avant tout travail de code non trivial ou ambigu :
1. Je propose une approche/plan.
2. Je liste précisément les **fichiers à modifier/créer** et **ce que je vais y faire**.
3. Une fois le plan/la tâche approuvé (y compris via la todo-list de session), j'exécute sans
   redemander fichier par fichier pour ce qui est déjà dans le plan.
4. Je fais un **récap des fichiers touchés et des modifications réellement apportées**.

En cas d'ambiguïté dans les specs (V1-V4) ou dans une ADR : je pose la question, je ne fais pas
d'hypothèse implicite.

### Commandes

- **Libres sans demander** : tout ce qui **vérifie ou installe en local** — `pnpm lint`, `pnpm
  test`, `pnpm build`, `pnpm check` (tsc), `pnpm exec vitest`, `pnpm dev` (serveur dev), `pnpm
  add`/`remove` (dépendances), `pnpm exec dx-flow ...`. Git en local : `status`, `diff`, `log`,
  `add`, `commit`.
- **Autorisation requise avant** : `git push` (et *a fortiori* tout `--force`), suppression de
  branche, réécriture d'historique (`rebase`, `reset --hard`, `amend`), toute action GitHub
  (PR, issue, release), et toute commande destructive hors dépôt.

## Stack

Stack V1 (specs), déjà en place ou à installer au fil des tâches :

| package | rôle |
|---|---|
| `react` / `react-dom` `^19` | Framework UI |
| `typescript` `~6.0` | Typage statique |
| `vite` `^8` | Build tool |
| `react-router` | Routing (V1 : `/evaluation`, `/draws`, `/geometry` ; V2 ajoute `/laboratory` ; V3 `/discovery` ; V4 `/eurospace`) |
| `@tanstack/react-query` | Fetch / cache (CSV, futur adapter API) |
| `zod` | Validation (`Grid`, formulaires) |
| SCSS / CSS Modules | Styles |
| `recharts` | Visualisations 2D ; `d3` seulement pour le sur-mesure avancé |
| `vitest` + Testing Library + Playwright | Tests (unit + E2E) |
| `three` / `@react-three/fiber` / `@react-three/drei` | V3 (point cloud spike) puis V4 (`/eurospace`) |
| `pnpm` | Package manager |
| `oxlint` | Linter (voir plus bas — remplace Biome) |
| `@keyobs/dx-flow` (husky + commitlint + lint-staged) | Hooks Git, commits conventionnels, scripts de release |

Pas d'i18n (i18next) ni de Storybook : aucune des specs V1-V4 n'en a besoin pour l'instant. À
reconsidérer seulement si un besoin réel apparaît.

## Structure

Architecture V1 (le domaine mathématique ne dépend jamais de React ni d'une lib de rendu) :

```
src/
  app/
  pages/
    evaluation/
    draws/
    geometry/
  domain/
    grid/
    draw/
    features/
    geometry/
    scoring/
  application/
  infrastructure/
    repositories/
    csv/
    api/
  shared/
```

V2 ajoute `pages/laboratory/` + le moteur de backtest dans `domain`/`application`. V3 ajoute
`pages/discovery/` + `domain/discovery` (embeddings, clustering). V4 ajoute `features/eurospace/`
et `pages/eurospace/` (voir `devdx/specs_v4.md#architecture-proposée` pour le détail).

**Alias d'import** : pas encore configurés (imports relatifs pour l'instant). La section
"Ordre des imports" ci-dessous décrit la cible (`@models/`, `@api/`, `@utils/`, `@hooks/`,
`@providers/`, `@components/`) à mettre en place via `tsconfig`/`vite.config` quand le nombre de
fichiers le justifiera — ne pas inventer ces alias avant qu'ils existent réellement.

## Style de dev

- Composants fonctionnels uniquement, définis en arrow function + export par défaut, jamais
  `export function XxxComponent() {...}` :
  ```ts
  const XxxComponent = (props: XxxComponentProps) => { ... };
  export default XxxComponent;
  ```
  **Providers** : Context et Provider séparés dans deux fichiers (`XxxContext.tsx` = `createContext`
  + hook `useXxx`, tout en export nommé ; `XxxProvider.tsx` = le composant seul, arrow + export par
  défaut comme les autres composants) — évite de mélanger export par défaut et export nommé dans un
  même fichier. Ex : `ApiContext.tsx`/`ApiProvider.tsx`.
- Props en interface nommée (`interface XxxProps`)
- Pas de `any`, pas de `unknown` sans narrowing immédiat
- Imports React : hooks nommés individuellement — `import { useState, useEffect } from 'react'`
- Imports terminés par un point-virgule (`;`)
- Ne pas utiliser `FormEvent`/`FormEventHandler` (dépréciés dans les types React) : utiliser
  `SubmitEvent`, `ChangeEvent`, ou `SyntheticEvent` selon le cas
- Éviter l'attribut `autoFocus` (a11y)
- Commentaires dans le code : toujours en anglais
- Pas d'abstraction prématurée — 3 lignes similaires ne justifient pas un helper
- `data-testid` sur tout élément interactif ou observable (boutons, lignes de table, états vides...)
  — pattern `{prefix}-{role}` pour les éléments répétés
- **Fichiers : toujours `Read` l'état courant avant modification** — ne jamais supposer que la
  mémoire de session est à jour. `Edit` ciblé, jamais `Write` sur un fichier existant.
- Context React uniquement pour les valeurs partagées quasi-statiques ; `useState`/`useReducer`
  pour l'état local
- Le domaine mathématique (`domain/`) reste pur TypeScript, testable sans React et sans lib de
  rendu (three.js compris) — c'est la règle centrale des ADR/specs

### Ordre des imports
```
1. CSS / SCSS / SASS
2. Libs        (react, react-router, @tanstack/react-query, …)
3. App         — dans cet ordre :
   3a. types / models    (@models/… ou src/domain relatif tant que l'alias n'existe pas)
   3b. api               (@api/… ou src/infrastructure relatif)
   3c. utils             (@utils/…)
   3d. hooks             (@hooks/… ou hook colocalisé de la feature)
   3e. providers         (@providers/…)
   3f. composants partagés (@components/…)
   3g. composants colocation (même dossier feature, imports relatifs ./…)
```

### Nommage & fichiers
- Composants React `.tsx` : PascalCase (`Gates.tsx`)
- Hooks `.ts` : camelCase (`useGates.ts`)
- Fichiers non-hook `.ts`/`.scss` : camelCase
- Fichiers test : camelCase (`Gates.test.tsx`)

### Tests
- **Vitest** — objectif **80% de couverture**, en particulier sur `domain/` (logique scientifique)
- Composants : au minimum un test de rendu sans crash
- **Privilégier des helpers purs testables sans React** quand la logique s'y prête : une logique
  extraite d'un composant est une logique qui reste couverte
- Playwright pour l'E2E (parcours saisie → évaluation → géométrie, etc., voir critères d'acceptation
  de chaque spec)
- Invariants scientifiques toujours couverts : invariance à l'ordre d'une `Grid`, `distance(x,x)=0`
  et symétrie, absence de fuite temporelle dans les backtests, déterminisme du seed

## Git workflow

- Hébergé sur GitHub.
- **Branches** : `main` protégée (aucun commit/push direct — bloqué par le hook `pre-commit` de
  `dx-flow`), `develop` = branche de travail courante. Pas de branche par tâche par défaut ; on
  crée une branche dédiée seulement si explicitement demandé.
- **Commits** : autorisés — un commit conventionnel par tâche terminée, sur `develop`, sauf
  instruction contraire. Format imposé par `commitlint.config.mjs` :
  `type(scope): subject` (**scope obligatoire**). Types acceptés (insensibles à la casse) : `feat`,
  `fix`, `doc`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `core`, `revert`,
  `merge`, `config`, `clean`.
- **Push** : jamais sans autorisation explicite, même sur `develop`.
- Hooks `dx-flow` actifs : `pre-commit` (branche protégée, garde anti-`.env`, `lint-staged`,
  `tsc --noEmit` sur les fichiers staged), `commit-msg` (commitlint), `pre-push` (`lint:fix` puis
  `test:run` — bloque le push vers `develop` si les tests échouent).

