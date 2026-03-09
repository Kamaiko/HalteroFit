# Halterofit Web — Planification & Référence

> Document de référence pour le développement du site web compagnon de Halterofit.
> Créé mars 2026. À lire avant de démarrer une nouvelle session Claude Code.
>
> **Stack décidée :** Next.js 16 · TypeScript · Tailwind v4 · Vercel AI SDK · Supabase · pgvector
> **Core feature :** AI Coach avec RAG (aucun concurrent ne fait ça)
> **Structure cible :** Monorepo Turborepo (`apps/mobile` + `apps/web` + `packages/`)
> **Template de référence :** https://github.com/t3-oss/create-t3-turbo

---

# PARTIE 1 — Site compagnon Halterofit (Next.js 16)

> Contexte : Halterofit est une app mobile React Native/Expo de workout tracking/logging avec Supabase (PostgreSQL) comme backend. 1,500+ exercices, plans d'entraînement, sets/reps logging. Phase 2 en cours, analytics Phase 6 (futur).
> Objectif : Un site web compagnon qui se différencie de ce qui existe déjà (JEFIT, Hevy, Fitbod, etc.)

## Analyse compétitive — Ce qui existe déjà (ne pas refaire)

| App                   | Ce qu'elle fait déjà bien                                                                           | Leur faiblesse                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **JEFIT**             | Exercise database SEO, web dashboard, analytics AI récent (pattern matching basique sur historique) | UI datée, AI = suggestions génériques, pas de vraie périodisation             |
| **Hevy**              | Full web app, social feed, HevyGPT (wrapper ChatGPT), Coach platform                                | HevyGPT = chatbot générique, pas de data viz avancé, pas de 3D                |
| **Fitbod**            | Muscle fatigue modeling, 1RM estimation, auto-programming                                           | Pas de web app, pas bon pour powerlifting/halté, pas de coach conversationnel |
| **JuggernautAI**      | Vraie périodisation par blocs, readiness questionnaires                                             | $35/mois, mobile-only, powerlifting-only, pas de web                          |
| **Dr. Muscle**        | DUP, progressive overload automation, lance un PWA                                                  | UX clunky, $49/mois, petite base                                              |
| **Alpha Progression** | Hypertrophy AI, bonne exercise library                                                              | Hypertrophie seulement, pas de social, pas de web                             |
| **TrainHeroic**       | Coach→athlete platform + marketplace                                                                | Pas d'AI, juste un outil de livraison, pas de data viz                        |
| **MuscleWiki**        | 1M+ visites/mois, exercise database SEO, muscle map interactive                                     | Pas d'app, pas de tracking, pas d'AI, juste du contenu                        |

### Le gap que PERSONNE ne comble :

1. **Visualisation 3D du corps** avec données de training réelles (volume par muscle, progression) — zéro compétiteur fait ça bien
2. **AI coaching intelligent** qui comprend la périodisation ET peut converser naturellement — les "AI" actuelles sont soit des chatbots génériques (Hevy), soit des algorithmes fermés (Fitbod/Juggernaut)
3. **Web comme cerveau analytique** pendant que le mobile est les mains — la plupart des apps n'ont PAS de web ou c'est une copie du mobile
4. **Exercise database comme SEO funnel** avec du contenu riche — MuscleWiki prouve que ça drive 1M+ visites/mois

---

## 10 idées pour le site web compagnon Halterofit

### 1. HalterCoach AI — Coach conversationnel intelligent (RSC + API routes)

**Ce que c'est :** Un coach AI intégré au site qui a accès à tout ton historique d'entraînement (via Supabase) et peut :

- **Analyser ta progression** : "Tu stagnes sur le bench press depuis 3 semaines. Ton volume de pecs a augmenté de 40% mais ton triceps n'a pas suivi. Je recommande d'ajouter des close-grip bench."
- **Générer des programmes** : Pas un chatbot qui sort un programme random — un AI qui utilise tes données réelles (PRs, volume historique, fréquence par muscle) pour créer un programme périodisé adapté.
- **Répondre à des questions fitness** : RAG sur une base de connaissances de science de l'entraînement (pas du broscience, des études peer-reviewed).
- **Ajuster en temps réel** : "Tu as raté tes 3 derniers sets de squat à 315. On réduit à 295 pour les 2 prochaines semaines et on remonte progressivement."

**Pourquoi c'est DIFFÉRENT de JEFIT/Hevy/Fitbod :**

- JEFIT AI = pattern matching basique sur ton historique. Pas conversationnel, pas de contexte profond.
- HevyGPT = wrapper ChatGPT. Ne voit PAS tes données d'entraînement. Génère des programmes génériques.
- Fitbod = algorithme fermé. Tu ne peux pas lui poser de questions ou comprendre son raisonnement.
- **HalterCoach** = LLM avec accès COMPLET à tes données Supabase + RAG sur la science du training + raisonnement expliqué. Tu peux DIALOGUER avec ton historique.

**Pourquoi Vinext :**

- **RSC** : Le chat stream les réponses du serveur (streaming SSR). Le composant chat ne charge aucun JS inutile.
- **API routes** : Appels à Claude/OpenAI API côté serveur, requêtes Supabase, RAG pipeline.
- **Server Actions** : "Appliquer ce programme" → sauvegarde directe dans Supabase depuis le chat.
- **Middleware** : Rate limiting sur les appels AI, auth vérification.

**Wow factor portfolio :** Montrer un AI coach qui tire des insights de VRAIES données d'entraînement, pas des réponses génériques. En entrevue : "J'ai intégré un LLM avec RAG et accès à une base PostgreSQL de 50K+ sets enregistrés."

---

### 2. Body Analytics 3D — Visualisation du volume musculaire sur un corps 3D (R3F)

**Ce que c'est :** Un modèle 3D de corps humain (R3F) qui se colore dynamiquement selon tes données d'entraînement :

- **Heatmap musculaire** : Rouge = haut volume cette semaine, bleu = sous-entraîné. Basé sur le mapping exercice → muscles (déjà dans ta DB : target_muscles, secondary_muscles).
- **Timeline** : Slider temporel pour voir l'évolution semaine par semaine. Animation fluide des couleurs.
- **Déséquilibres** : Détection visuelle immédiate (push vs pull, gauche vs droite, upper vs lower).
- **Comparaison** : Overlay de ta semaine actuelle vs une semaine "idéale" ou vs ta meilleure semaine.

**Pourquoi c'est DIFFÉRENT :**

- JEFIT a des charts 2D basiques. Personne ne fait de body mapping 3D interactif avec données réelles.
- Fitbod a un concept similaire (fatigue par muscle) mais c'est un diagramme 2D plat, pas un modèle 3D rotatif.
- La visualisation 3D rend les déséquilibres ÉVIDENTS d'un coup d'oeil — impossible avec des charts.

**Pourquoi Vinext :**

- **RSC** : Le calcul du volume par muscle (agrégation sur des milliers de sets) se fait côté serveur. Le client reçoit juste les valeurs de heatmap.
- **SSR** : Pages publiques de "body stats" partageables (profil public).
- **API routes** : Agrégation de données Supabase complexe.

**Wow factor portfolio :** Un modèle 3D R3F qui respire et se colore en temps réel. En entrevue : "J'ai mappé 1,500 exercices sur un modèle anatomique 3D avec des données de training réelles."

---

### 3. Exercise Encyclopedia — 1,500+ pages SEO avec contenu riche (SSR + ISR)

**Ce que c'est :** Transformer ta base de 1,500+ exercices en un site de référence SEO :

- **Page par exercice** : GIF de démonstration, muscles ciblés (avec body map interactive), instructions, variations, erreurs communes, progression suggérée.
- **Pages par muscle** : "Tous les exercices pour les quadriceps" avec filtres par équipement.
- **Pages par équipement** : "Tous les exercices avec barbell" — utile pour les home gym.
- **Contenu enrichi par AI** : Utiliser un LLM pour générer des guides de forme détaillés, tips de coaching, et alternatives pour chaque exercice (contenu généré une fois, puis ISR).
- **Body map interactive** : Clique sur un muscle → vois tous les exercices. Style MuscleWiki mais mieux.

**Pourquoi c'est DIFFÉRENT :**

- MuscleWiki a 1M+ visites/mois avec un concept similaire mais SANS app mobile, SANS tracking, SANS AI.
- JEFIT a des pages d'exercices mais datées et pas rich-content.
- Toi tu as l'avantage : les pages SEO → funnellent vers le download de l'app Halterofit. Chaque visiteur qui cherche "how to barbell row" arrive sur ton site, voit la qualité, download l'app.

**Pourquoi Vinext :**

- **SSR** : 1,500+ pages avec HTML complet pour Google. C'est LE use case parfait.
- **ISR** : Régénération automatique quand tu enrichis le contenu d'un exercice.
- **RSC** : Body map interactive côté serveur (zéro JS pour le rendu initial).
- **Metadata API** : OpenGraph dynamique pour chaque exercice (partage social avec preview).

**Wow factor portfolio :** "J'ai build un site de 1,500+ pages avec SSR/ISR, body map interactive, et contenu AI-enrichi qui sert de funnel d'acquisition pour mon app mobile."

---

### 4. Program Builder Pro — Éditeur de programmes sur grand écran (Web-only)

**Ce que c'est :** L'UX de création de programme sur mobile est limitée par l'écran. Le web offre :

- **Éditeur drag-and-drop** : Semaine en colonnes, jours en lignes, exercices drag-and-drop avec Framer Motion.
- **Vue calendrier** : Visualise 4-12 semaines de programme d'un coup (impossible sur mobile).
- **Superset builder** : Glisse un exercice sur un autre pour créer un superset visuellement.
- **Template library** : Browse et fork des programmes pré-faits (Push/Pull/Legs, 5/3/1, GZCL, nSuns).
- **Sync bidirectionnelle** : Sauvegarde dans Supabase → disponible sur l'app mobile immédiatement.

**Pourquoi c'est DIFFÉRENT :**

- TrainHeroic fait du program building web, mais c'est un outil pour COACHS ($$$), pas pour l'athlète solo.
- Hevy web permet d'éditer des routines, mais c'est la même UI que le mobile, pas optimisée.
- Un vrai éditeur web-optimisé avec drag-and-drop et vue macro est un différenciateur clair.

**Pourquoi Vinext :**

- **Server Actions** : Sauvegarde automatique en background (comme Google Docs).
- **RSC** : Chargement de la bibliothèque d'exercices côté serveur.
- **API routes** : Sync avec Supabase, import/export de programmes.

---

### 5. Progress Dashboard — Analytics avancés sur grand écran (RSC streaming)

**Ce que c'est :** Le grand écran permet des visualisations impossibles sur mobile :

- **1RM Estimations** : Graphiques de progression de 1RM estimé (Brzycki/Epley) pour chaque exercice majeur, avec trend lines et projections.
- **Volume Analytics** : Volume total par muscle/semaine avec charts empilés. Comparaison période vs période.
- **PR Timeline** : Frise chronologique de tous tes records personnels avec animations.
- **Training Frequency Heatmap** : Calendrier style GitHub contributions — chaque jour coloré par intensité d'entraînement.
- **Strength Standards** : Compare tes lifts aux standards de force par poids de corps et expérience (Beginner → Elite).

**Pourquoi c'est DIFFÉRENT :**

- L'analytics est le parent pauvre de TOUTES les apps fitness. JEFIT a des charts basiques. Hevy a des graphiques simples. Personne ne fait de data viz riche et interactif.
- Le format web grand écran permet des dashboards que le mobile ne peut pas afficher.

**Pourquoi Vinext :**

- **RSC streaming** : Les agrégations lourdes (50K+ sets) se font côté serveur et les résultats streament progressivement vers le client. L'utilisateur voit les charts apparaître un par un au lieu d'attendre.
- **ISR** : Dashboard snapshots partageables en URL publique.
- **API routes** : Calculs statistiques complexes côté serveur.

---

### 6. Social Profiles & Leaderboards — Pages publiques d'athlètes (SSR)

**Ce que c'est :** Chaque utilisateur Halterofit peut avoir un profil public :

- **Carte d'identité d'athlète** : Stats clés (total en halté, PR sur les lifts principaux, années d'entraînement).
- **Body heatmap 3D** publique (réutilise l'idée #2).
- **Leaderboards** : Classement par catégorie de poids de corps × mouvement. "Top squatteurs 80-90kg au Québec."
- **Badges/Achievements** : "1000 lbs Club" (total squat+bench+dead ≥ 1000), "365 days streak", etc.
- **Partage social** : OpenGraph rich previews — quand tu partages ton profil sur Instagram/Facebook, ça montre tes stats et ta heatmap.

**Pourquoi c'est DIFFÉRENT :**

- Hevy a du social mais c'est un feed (posts de workouts). Pas de vrais profils d'athlètes avec stats agrégées.
- Les leaderboards par catégorie de poids n'existent nulle part avec des données RÉELLES (les sites de powerlifting utilisent des données de compétitions, pas de training quotidien).

**Pourquoi Vinext :**

- **SSR** : Les profils publics DOIVENT être SSR pour le SEO et les rich previews social.
- **ISR** : Les profils se régénèrent quand l'utilisateur log un nouveau workout.
- **Middleware** : Privacy controls (profil public/privé).

---

### 7. Landing Page Premium + Marketing (SSR + animations)

**Ce que c'est :** Un site vitrine premium pour l'app Halterofit :

- **Hero section** : Animations Framer Motion premium, démo interactive de l'app.
- **Feature showcase** : Sections avec parallax, démos vidéo, screenshots animés.
- **Pricing page** : Tiers Free/Pro/Coach avec comparaison interactive.
- **Blog/Content** : Articles SEO sur le fitness (lié à l'Exercise Encyclopedia #3).
- **Download CTAs** : App Store / Google Play badges partout.

**Pourquoi c'est DIFFÉRENT :**

- C'est la base que toute app sérieuse a besoin. Mais avec Vinext + tes skills en animation, ça peut être un site vitrine premium qui EST lui-même un portfolio piece.

**Pourquoi Vinext :**

- **SSR** : SEO total pour toutes les pages marketing et blog.
- **ISR** : Blog posts avec contenu dynamique.
- **API routes** : Newsletter signup, contact form, waitlist.

---

### 8. Workout Social Feed — Partage de séances avec preview SSR

**Ce que c'est :** Un feed public où les utilisateurs partagent leurs workouts :

- **Carte de workout** : Résumé visuel (exercices, volume total, durée, PRs atteints).
- **Réactions** : High-five, fire, strong (pas des likes — des réactions fitness).
- **Comments** : Discussion sous chaque workout.
- **Weekly digest** : Email résumant l'activité de tes amis (engagement driver).

**Pourquoi c'est DIFFÉRENT de Hevy :**

- Hevy fait ça mais DANS l'app mobile. L'avantage web : les cartes de workout ont des URLs SSR → partageables sur Instagram stories, Twitter, Reddit. Quand quelqu'un clique, il voit un beau résumé → funnel vers l'app.

**Pourquoi Vinext :**

- **SSR** : Chaque workout partagé a une page avec rich OpenGraph preview.
- **RSC** : Feed rapide, pagination côté serveur.
- **Server Actions** : Réactions, comments.

---

### 9. Plate Calculator & Warm-Up Generator — Outils utilitaires (funnel SEO)

**Ce que c'est :** Des micro-outils gratuits qui attirent du trafic :

- **Plate Calculator** : Entre un poids → voit visuellement quelles plaques mettre de chaque côté de la barre (animation 3D R3F avec barre + plaques).
- **1RM Calculator** : Entre poids × reps → estimation du 1RM avec plusieurs formules (Brzycki, Epley, Lander) et graphique comparatif.
- **Warm-Up Generator** : Entre ton working set → génère une séquence de warm-up (%, sets, reps) avec timer intégré.
- **RPE/RIR Converter** : Table interactive RPE ↔ RIR ↔ %1RM.
- **Wilks/DOTS Calculator** : Compare ta force ajustée par poids de corps.

**Pourquoi c'est DIFFÉRENT :**

- Ces outils existent en isolation mais sont éparpillés, moches, et sans connexion à une app. Les centraliser sur un seul site de qualité avec un funnel vers l'app = acquisition gratuite.
- Le plate calculator en 3D (R3F) = personne ne fait ça. C'est un wow factor petit mais viral.

**Pourquoi Vinext :**

- **SSR** : SEO pour "plate calculator", "1RM calculator" — keywords à fort volume.
- **RSC** : Calculs côté serveur, interface légère.
- **ISR** : Pages statiques ultra-rapides.

---

### 10. Coach Marketplace — Plateforme coach→athlète (futur, post-MVP)

**Ce que c'est :** Extension B2B d'Halterofit :

- **Coachs** : Créent et vendent des programmes sur le site web.
- **Athlètes** : Achètent/s'abonnent aux programmes, les reçoivent dans l'app mobile.
- **Suivi** : Le coach voit la progression de ses athlètes via le dashboard web.
- **Chat** : Communication coach↔athlète intégrée.
- **Revenue share** : Halterofit prend 15-20% de commission.

**Pourquoi c'est DIFFÉRENT :**

- TrainHeroic fait ça mais c'est cher et complexe. Hevy Coach est récent et basique.
- L'avantage : les coachs créent sur le WEB (grand écran, éditeur pro), les athlètes consomment sur le MOBILE (dans le gym). C'est le split parfait.

**Pourquoi Vinext :**

- **SSR** : Pages de coachs et programmes indexées par Google.
- **API routes** : Paiement (Stripe), gestion des abonnements.
- **Middleware** : Auth par rôle (coach vs athlète).
- **RSC** : Dashboard coach avec données en streaming.

---

## Ma recommandation : Le "Halterofit Web" MVP

**Combiner les idées #1 + #2 + #3 + #5 + #7 + #9 en un seul site Vinext :**

```
halterofit.ca (Vinext)
├── /                    → Landing page premium (#7)
├── /exercises           → Exercise Encyclopedia 1,500+ pages SSR (#3)
├── /exercises/[slug]    → Page exercice individuel avec body map
├── /tools/plate-calc    → Plate Calculator 3D (#9)
├── /tools/1rm           → 1RM Calculator (#9)
├── /tools/warmup        → Warm-Up Generator (#9)
├── /dashboard           → Progress Analytics (auth required) (#5)
├── /dashboard/body      → Body Analytics 3D (#2)
├── /coach               → HalterCoach AI (auth required) (#1)
├── /blog                → Articles SEO fitness
└── /download            → App Store / Google Play links
```

**Phase 1 (mois 1-3)** : Landing page + Exercise Encyclopedia + Tools SEO
**Phase 2 (mois 3-5)** : Dashboard Analytics + Body 3D (nécessite auth dans l'app mobile)
**Phase 3 (mois 5-8)** : HalterCoach AI
**Phase 4 (mois 8+)** : Social profiles, Coach marketplace

Cette approche :

- ✅ Apprend Vinext progressivement (SSR/ISR d'abord → RSC → API routes → Server Actions)
- ✅ Génère du trafic organique dès Phase 1 (1,500 pages SEO)
- ✅ Chaque phase est un portfolio piece en soi
- ✅ Le site compagnon a une VRAIE utilité (pas une copie du mobile)
- ✅ Se différencie de TOUT ce qui existe (3D body viz + AI coach contextuel + exercise SEO funnel)

---

---

# PARTIE 2 — Deep dive : Avatar 3D, AI Coach RAG, TDEE

## Avatar 3D "Character Creator" — Verdict honnête

### Ce qui EXISTE déjà :

- **Body Visualizer** (bodyvisualizers.com) : Sliders basiques → mannequin 3D générique. C'est un jouet, pas un outil.
- **ShapeScale** : Scanner 3D hardware avec précision niveau DEXA (97%). Coûte $9,780 ou $199/mois. B2B pour gyms/cliniques. 1M$ ARR première année.
- **ZOZOFIT** : Combinaison spéciale avec 15K+ marqueurs + caméra phone. Précision ±0.4cm. $40 pour le suit.
- **Naked Labs** : Scanner miroir rotatif pour la maison ($1,395). **Fermé en octobre 2023** — le marché home scanner n'était pas viable à ce prix.
- **SMPL** (Max Planck Institute) : Modèle paramétrique de corps humain (82 paramètres). Open source pour la recherche. Pourrait techniquement tourner dans R3F.

### Personne n'a fait le concept "RPG character creator → recommandations fitness"

Le concept exact de Patrick — ajuster ta silhouette comme un character creation menu puis recevoir des recommandations basées sur ta morphologie — **n'existe pas comme produit**.

### La science derrière : Honnêteté

| Concept                                        | Valide scientifiquement ?          | Détails                                                                                                                                                                                                                                     |
| ---------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Somatotypes (ecto/meso/endo)**               | **NON — largement réfuté**         | Inventé en 1940 par un psychologue pour corréler morphologie et personnalité. Les reviews modernes confirment que c'est "trop large, trop statique, pas fondé en physiologie."                                                              |
| **Ratios de membres → exercices**              | **OUI — mais étroit**              | Les ratios fémur/torse affectent réellement la biomécanique du squat et du deadlift (études peer-reviewed). Un long fémur + court torse = bénéfice du low-bar squat large stance. Mais ça affecte ~5-10 exercices, pas un programme entier. |
| **Composition corporelle par photo**           | **OUI — presque production-ready** | ShapedNet (2024) : erreur moyenne de 1.42% bodyfat vs DEXA depuis UNE photo. Amazon Halo avait R=0.96 corrélation avec DEXA. Pas encore de modèle turnkey pour le browser.                                                                  |
| **MediaPipe pour proportions dans le browser** | **OUI — faisable**                 | 33 landmarks, temps réel, modèle ~16MB. Bon pour ratios relatifs (longueur bras/jambes). Pas bon pour mesures absolues (±2-5cm sans calibration).                                                                                           |

### Verdict : L'avatar est un **eye candy**, pas un outil

**Ce qui est gimmick :**

- Créer un avatar 3D pour "se voir" → motivant 5 minutes, puis oublié
- Recommandations basées sur les somatotypes → pseudo-science
- Programme entier basé sur la morphologie → pas supporté par la littérature

**Ce qui est VRAIMENT utile (sans avatar) :**

- **Estimation de bodyfat par photo** → presque aussi précis que DEXA. Utilité réelle pour tracking de progression.
- **Ratios de membres** → cues sur la technique de squat/deadlift. Utile mais niche.
- **Body composition tracking dans le temps** → ShapeScale prouve que les utilisateurs adorent le before/after. Mais des mesures + photos suffisent.

### Ma recommandation honnête sur l'avatar :

**Ne bâtis PAS un character creator 3D comme feature principale.** Le wow factor visuel ne compensera pas le manque d'utilité réelle. CEPENDANT :

- **Body fat estimation par photo** pourrait être une feature killer si tu arrives à la faire tourner dans le browser (TensorFlow.js ou ONNX Runtime Web)
- **Le body heatmap 3D** (idée #2 plus haut) reste valide — ce n'est PAS un avatar customisable, c'est une VISUALISATION de tes données de training réelles. Ça a une utilité concrète.

---

## AI Coach avec RAG — La vraie opportunité

### Pourquoi c'est GENUINEMENT NOVEL :

**Aucune app fitness en production n'utilise RAG aujourd'hui.** Voici ce que font les "AI" actuelles :

| App                            | Leur "AI"                                               | Ce que c'est vraiment                                                          |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Fitbod                         | Algorithme de fatigue musculaire + 1RM prediction       | ML classique (pas de LLM, pas de RAG). Entraîné sur 150M+ workouts loggés.     |
| RP (Renaissance Periodization) | Ajustement de volume basé sur feedback (pump, soreness) | Système de règles codé par Dr. Mike Israetel. Pas d'AI du tout.                |
| JuggernautAI                   | Périodisation par blocs + readiness                     | Algorithme fermé. Pas conversationnel.                                         |
| HevyGPT                        | "AI workout generator"                                  | Wrapper ChatGPT. Ne voit PAS tes données. Prompt générique.                    |
| JEFIT AI                       | "Smart analytics"                                       | Pattern matching basique sur ton historique. Pas conversationnel.              |
| Smart Rabbit                   | Coach conversationnel                                   | Le plus avancé, mais pas de RAG sur la science. Focus mental health + fatigue. |

### Ce que HalterCoach ferait de DIFFÉRENT :

```
USER: "Je stagne sur mon bench press depuis 3 semaines. Qu'est-ce que je fais mal?"

HalterCoach (avec accès à Supabase + RAG):
"En regardant tes 47 dernières séances, je vois que :
1. Ton volume de pecs (sets × reps × poids) a augmenté de 42% sur 6 semaines
   mais ton volume de triceps n'a PAS suivi (+8% seulement)
2. Ton RPE moyen sur le bench est passé de 7.5 à 9.2 → signe de fatigue accumulée
3. Tu n'as pas eu de deload depuis 7 semaines

Selon Helms et al. (2015), un ratio de volume antagoniste/agoniste
<0.6 est associé à des plateaux sur les mouvements de pressing.
Et Zourdos et al. (2016) recommandent un deload toutes les 4-6 semaines
pour les lifters intermédiaires.

Je recommande :
- Semaine prochaine : deload (60% du volume actuel)
- Ajouter close-grip bench press 3×8 et dips 3×10 pour le triceps
- Reprendre en semaine 2 avec le volume précédent

Veux-tu que je génère ce programme et l'envoie dans ton app?"
```

**Ça, personne ne le fait.** Un LLM qui :

1. A accès à tes données RÉELLES (via Supabase queries)
2. Utilise la littérature scientifique (via RAG sur des papers/méta-analyses)
3. Peut EXPLIQUER son raisonnement (pas une boîte noire comme Fitbod)
4. Peut agir directement (Server Actions → sauvegarder un programme dans Supabase)

### Pipeline RAG pour fitness :

```
Sources de connaissances :
  1. ExerciseDB (1,500+ exercices structurés — déjà dans ta DB)
  2. Principes de training (périodisation, progressive overload, volume landmarks)
  3. Méta-analyses peer-reviewed (chunked + embedded) — PubMed/JSCR/MSSE
  4. Données utilisateur (historique d'entraînement via Supabase)

Pipeline :
  Question utilisateur
  → Embedding de la question
  → Recherche vectorielle dans les sources
  → Re-ranking avec cross-encoder
  → Assemblage du contexte (profil user + docs récupérés + données training)
  → Génération LLM avec citations
  → Filtre de sécurité (risque de blessure, disclaimer médical)
```

### Risques et limites :

- **Hallucination** : Le LLM peut inventer des études. Le RAG réduit ce risque mais ne l'élimine pas. Citations obligatoires.
- **Responsabilité** : Disclaimer clair "pas un substitut à un professionnel de la santé/coach certifié."
- **Coût API** : Chaque conversation = appels LLM. Budget ~$0.01-0.05 par échange avec Claude Haiku, plus avec Sonnet/Opus.
- **Curation du knowledge base** : La qualité du RAG dépend de la qualité des documents ingérés. Garbage in = garbage out.

---

## TDEE Adaptatif — Feature sous-estimée mais puissante

### Pourquoi c'est "EXTRÊMEMENT PERTINENT" (tes mots) :

Les calculateurs TDEE existants sont TOUS basés sur la formule Mifflin-St Jeor (1990) + un multiplicateur d'activité auto-déclaré. L'erreur est massive : ±10-20%.

### L'innovation : TDEE adaptatif avec données de workout

Le concept du [nSuns Adaptive TDEE Spreadsheet](https://github.com/oledid-forks/3-Suns_Adaptive_TDEE_Spreadsheet) :

- Track poids quotidien + calories ingérées
- Après 3+ semaines, calcule le VRAI TDEE à partir de la tendance de poids
- Thermodynamique de base : énergie ingérée - énergie stockée = énergie dépensée
- Avec 4-8 semaines de données → significativement plus précis que n'importe quelle formule

**Ce que PERSONNE ne fait :** intégrer les données de workout réelles pour un TDEE jour par jour :

- Jour de repos : TDEE baseline
- Jour de squat heavy (2h, RPE 9) : TDEE + estimation de dépense basée sur METs
- Jour de upper body light (45min, RPE 6) : TDEE + estimation moindre

Halterofit a DÉJÀ les données de workout (exercices, durée, poids, sets, reps). Combiner ça avec un tracker de poids/calories → TDEE adaptatif personnalisé impossible à obtenir ailleurs.

### Position stratégique :

- C'est clairement une feature **post-MVP** (nécessite un module nutrition dans l'app)
- MAIS c'est un killer feature pour le site web : "Connecte ton compte Halterofit → vois ton TDEE réel basé sur tes vrais workouts"
- L'AI Coach pourrait intégrer ces données : "Tu as brûlé ~2,800 kcal hier avec ta session de legs. Mange 200g de protéines aujourd'hui."

---

## Synthèse : Ce qui vaut la peine vs ce qui est du fluff

| Feature                                | Verdict                                              | Priorité                               |
| -------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| **Landing page premium**               | ✅ Essentiel                                         | Phase 1 — le minimum pour exister      |
| **AI Coach avec RAG**                  | ✅ Différenciateur #1. Personne ne fait ça.          | Phase 2 — le cœur du produit           |
| **Exercise Encyclopedia SEO**          | ✅ Prouvé (MuscleWiki = 1M+ visites/mois)            | Phase 1 — funnel d'acquisition gratuit |
| **TDEE adaptatif + workout data**      | ✅ Underserved, scientifiquement solide              | Phase 3 — nécessite module nutrition   |
| **Body heatmap 3D**                    | ✅ Utile + wow factor (visualise tes VRAIES données) | Phase 2-3 — complément au dashboard    |
| **Avatar character creator**           | ❌ Gimmick. Eye candy sans utilité réelle.           | Ne pas faire.                          |
| **Body fat estimation par photo**      | ⚠️ Science solide mais implémentation browser dure   | Exploration future — pas MVP           |
| **Outils SEO (plate calc, 1RM, etc.)** | ✅ Quick wins SEO, peu d'effort                      | Phase 1 — keywords à fort volume       |
| **Social profiles / leaderboards**     | ⚠️ Nice-to-have                                      | Post-MVP                               |
| **Coach marketplace**                  | ❓ Questionnable si AI Coach est assez bon           | Évaluer post-MVP                       |

## ~~Vision raffinée v1~~ (remplacée par v2 ci-dessous)

---

---

# PARTIE 3 — Vision finale : Halterofit Web centré AI Coach

## Réponse directe : OUI, le site devrait être centré autour de l'AI

**Pourquoi l'AI Coach est le "gros bloc" :**

1. **Genuinement inédit** — aucun compétiteur n'a un LLM + RAG + accès aux données réelles
2. **Justifie le format web** — les longues conversations coaching sont meilleures sur grand écran
3. **Hub central** — l'AI Coach peut proposer analytics, générer des programmes, calculer le TDEE, expliquer des exercices → tout passe par lui
4. **Portfolio piece maximal** — "J'ai build un AI coach fitness avec RAG, accès à une DB PostgreSQL de 50K+ sets, et streaming SSR"
5. **Data moat** — plus l'utilisateur l'utilise, plus le contexte est riche, plus les recs sont précises

## Features retenues (après filtrage)

| Feature                                      | Rôle                                 | Priorité           |
| -------------------------------------------- | ------------------------------------ | ------------------ |
| **Landing page premium**                     | Vitrine + download CTA               | Phase 1            |
| **Exercise Encyclopedia (1,500+ pages SSR)** | Funnel SEO → downloads app           | Phase 1            |
| **AI Coach avec RAG**                        | Cœur du produit web                  | Phase 2            |
| **Body fat estimation par photo**            | Feature "wow" avec utilité réelle    | Phase 2-3 (R&D)    |
| **Body heatmap 3D (R3F)**                    | Visualisation de données de training | Phase 2-3          |
| **TDEE adaptatif avec workout data**         | Killer feature nutrition             | Phase 3 (post-MVP) |

### Features RETIRÉES et pourquoi :

- ~~Plate calculator~~ → pas pertinent
- ~~Warmup generator~~ → drop
- ~~Avatar 3D character creator~~ → gimmick
- ~~Program Builder Pro~~ → redondant avec l'app
- ~~Progress Dashboard~~ → sera dans l'app mobile
- ~~Social feed~~ → pas prioritaire
- ~~Coach marketplace~~ → si l'AI Coach est bon, quel besoin ?
- ~~1RM Calculator standalone~~ → subtilement intégré dans l'AI Coach ou les pages exercice

## Note sur le choix de technologie

Vinext n'est PAS obligatoire. Options valides :

| Option                                 | Pour                                             | Contre                                 |
| -------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| **Next.js 16**                         | Mature, SSR/RSC/ISR natif, énorme écosystème     | Lock-in Vercel (ou self-host complexe) |
| **Vinext (Vite)**                      | Tu connais Vite, build rapide, deploy CF Workers | Expérimental (~2 semaines d'existence) |
| **Vite SPA + Supabase Edge Functions** | Simple, tu connais Vite                          | Pas de SSR (bye SEO 1,500 pages)       |
| **Remix / React Router v7**            | SSR natif, très React-idiomatic                  | Moins de traction, RSC limité          |

**Recommandation :** Next.js 16 = choix safe. Vinext = cutting edge risqué. Pour 6-12+ mois, Next.js est plus prudent. Alternative : tester Vinext en Phase 1 (contenu statique, facilement migrable si ça casse).

## Architecture high-level

```
┌─────────────────────────────────────────────┐
│              Halterofit Web                  │
│         (Next.js 16 ou Vinext)               │
├─────────────────────────────────────────────┤
│  Landing Page           Exercise Encyclopedia│
│  (SSR, animations)      (1,500+ pages SSR)   │
│                                             │
│  AI Coach (RSC streaming)                    │
│  ├── LLM (Claude API)                       │
│  ├── RAG (Supabase pgvector)                │
│  ├── User data (Supabase PostgreSQL)        │
│  └── Server Actions (sync → app mobile)     │
│                                             │
│  Body Heatmap 3D (R3F)                      │
│  Body Fat Photo (TF.js ou API route)        │
│  TDEE Adaptatif (post-MVP)                  │
├─────────────────────────────────────────────┤
│              Supabase Backend                │
│  ├── PostgreSQL (users, workouts, sets)     │
│  ├── pgvector (RAG embeddings)              │
│  ├── Auth (email/password, OAuth)           │
│  └── Storage (GIFs, user photos)            │
├─────────────────────────────────────────────┤
│           Halterofit Mobile App              │
│       (React Native / Expo / WatermelonDB)   │
│              ↕ Sync Supabase                 │
└─────────────────────────────────────────────┘
```

### Avantage : Supabase + pgvector

Tu utilises DÉJÀ Supabase. pgvector = extension PostgreSQL native pour embeddings vectoriels. Pas besoin de Pinecone/Weaviate. Ton RAG pipeline tourne dans ta DB existante :

1. Ingestion : chunk documents scientifiques → embed → stocke dans pgvector
2. Retrieval : embed la question → recherche vectorielle → docs pertinents
3. Generation : docs + données user + question → LLM → stream la réponse

## Ce qui reste à explorer (prochaines sessions)

1. **Body fat estimation** : faisabilité browser (TF.js) vs API route
2. **Plan de dev semaine par semaine**
3. **UX de l'AI Coach** : chat classique vs assistant contextuel vs hybride

---

---

# PARTIE 4 — Choix de technologie & Guide pédagogique AI

## Choix du framework : Next.js vs Vinext vs Vite SPA

### Pourquoi un SPA est INSUFFISANT pour ce projet

Un SPA (Single Page Application) comme ton portfolio actuel a une limitation critique pour Halterofit Web : **pas de SSR = pas de SEO**.

| Ce que tu veux faire                        | SPA (Vite pur)                                              | SSR (Next.js / Vinext)                                                 |
| ------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1,500 pages d'exercices indexées par Google | Google voit `<div id="root">` → indexation quasi impossible | Google reçoit du HTML complet → indexation parfaite                    |
| Partage social avec preview (OpenGraph)     | Les bots de Facebook/Twitter ne voient rien → lien "nu"     | Le serveur génère les meta tags → preview riche avec image/description |
| Landing page rapide (premier affichage)     | Blanc → JS charge → contenu                                 | Contenu immédiat                                                       |
| AI Coach (streaming)                        | Faisable avec un backend séparé                             | API routes intégrées, streaming natif                                  |

**Conclusion : Tu as BESOIN de SSR pour les 1,500 pages d'exercices.** Sans ça, tu perds le funnel SEO qui est ta principale stratégie d'acquisition.

### Next.js 16 vs Vinext : Ma recommandation honnête

**Next.js 16 est le bon choix.** Voici pourquoi :

| Critère                | Next.js 16                                             | Vinext                                          |
| ---------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| **Maturité**           | 8+ ans, des millions de sites en production            | ~2 semaines d'existence                         |
| **Employabilité**      | ~70% des offres React senior mentionnent Next.js       | 0% des offres (personne ne le connaît encore)   |
| **Support LLM**        | Claude/GPT connaissent Next.js par coeur → aide au dev | Très peu de training data → l'AI t'aidera moins |
| **Ecosystem**          | Vercel AI SDK, NextAuth, next-intl, etc.               | Presque rien encore                             |
| **Documentation**      | Excellente, mature, tonnes de tutoriels                | README GitHub seulement                         |
| **Bugs en production** | Connus et documentés                                   | Inconnus (pas testé à l'échelle)                |
| **Build speed**        | 7.4s (Turbopack)                                       | 4.6s (Vite) / 1.7s (Rolldown)                   |
| **Client bundle**      | ~169 KB gzip                                           | ~74 KB gzip (57% plus petit)                    |
| **Déploiement**        | Vercel (1 clic), self-host, Docker, Cloudflare         | Cloudflare Workers principalement               |

**Le compromis pragmatique :** Apprends Next.js maintenant. Les concepts (SSR, RSC, API routes, Server Actions, file-based routing) sont **identiques** dans Vinext. Si Vinext mûrit dans 1-2 ans, tu pourras migrer facilement parce que l'API est la même. Tu n'as rien à désapprendre.

**L'argument de carrière est fort :** Tu ne sais pas encore quel type de dev tu seras. Next.js est demandé en frontend, fullstack, et même backend-for-frontend. C'est un investissement sûr. Vinext est un pari.

### Où expérimenter Vinext quand même

Si tu veux goûter à Vinext sans risquer ton projet principal : fais un petit side project de test (un week-end). Prends l'Exercise Encyclopedia seulement, build 10 pages avec Vinext, déploie sur Cloudflare Workers. Tu verras la DX et tu pourras comparer. Mais le projet Halterofit Web principal → Next.js 16.

---

## Guide pédagogique : Comment fonctionne l'AI

### Qu'est-ce qu'un RAG ? (Explication simple)

Imagine un **examen à livre ouvert** :

- **Sans RAG** : Le LLM (Claude, GPT) répond de mémoire. Parfois il se trompe (hallucinations).
- **Avec RAG** : AVANT de répondre, le LLM fouille dans TA bibliothèque de documents pour trouver les passages pertinents, puis répond en se basant dessus.

**Le pipeline complet, étape par étape :**

```
ÉTAPE 1 — Ingestion (une seule fois)
Tu prends tes documents (articles de science du training, guides de
périodisation, données d'exercices) et tu les convertis en "embeddings"
— des vecteurs de nombres qui capturent le SENS du texte.

  "Le back squat cible principalement les quadriceps et les fessiers..."
      → [0.023, -0.451, 0.892, ..., 0.117]  (1536 nombres)

Ces vecteurs sont stockés dans une base de données vectorielle.

ÉTAPE 2 — Retrieval (à chaque question)
Quand l'utilisateur demande "Quels muscles travaille le back squat?",
sa question est AUSSI convertie en vecteur. La base vectorielle trouve
les documents les plus "proches" en sens (similarité cosinus).

ÉTAPE 3 — Augmentation
Les passages trouvés sont injectés dans le prompt du LLM :
  "Voici le contexte : [passage 1] [passage 2] [passage 3]
   Question : Quels muscles travaille le back squat?"

ÉTAPE 4 — Génération
Le LLM répond en se basant sur les passages fournis.
Il peut citer ses sources. Il hallucine beaucoup moins.
```

### Qu'est-ce qu'un embedding ?

Un embedding = une liste de nombres qui représente le "sens" d'un texte. Les textes avec un sens similaire ont des vecteurs similaires.

```typescript
// Conceptuellement (les vrais vecteurs ont 1536+ dimensions)
const squat = [0.9, 0.1, 0.8, 0.2]; // composé, bas du corps, haute charge
const deadlift = [0.85, 0.15, 0.75, 0.3]; // similaire !
const bicepCurl = [0.1, 0.9, 0.2, 0.1]; // très différent

// similarité :
// squat vs deadlift = 0.98 (très proches)
// squat vs bicepCurl = 0.15 (très différents)
```

Tu ne crées jamais d'embeddings à la main. Tu appelles une API :

```typescript
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Le back squat cible les quadriceps...',
});
const vector = response.data[0].embedding; // [0.023, -0.451, ...]
```

### Les 7 patterns d'intégration AI (du plus simple au plus complexe)

| #   | Pattern                         | Complexité | Description                                                                                      | Pour Halterofit ?                              |
| --- | ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| 1   | **Prompt Engineering**          | Facile     | Tu craftes un system prompt avec le profil utilisateur. Pas de DB vectorielle, pas d'embeddings. | ✅ Fondation — on commence par ça              |
| 2   | **Structured Output**           | Facile     | Tu forces le LLM à sortir du JSON valide (programmes d'entraînement parsables par ton app)       | ✅ Essentiel pour générer des programmes       |
| 3   | **Tool Use / Function Calling** | Moyen      | Tu donnes au LLM des "outils" (fonctions) qu'il peut appeler — ex: requêter Supabase             | ✅ C'est comme ça que le coach lit tes données |
| 4   | **RAG**                         | Moyen      | Retrieval depuis une base de connaissances (science du training)                                 | ✅ Pour citer des études, pas halluciner       |
| 5   | **Multi-Modal**                 | Moyen      | Le LLM reçoit des images (photos de forme, estimations bodyfat)                                  | ⚠️ Plus tard (body fat par photo)              |
| 6   | **Agents**                      | Complexe   | Un LLM dans une boucle qui planifie, utilise des outils, observe, et continue                    | ⚠️ Si nécessaire pour workflows complexes      |
| 7   | **Fine-Tuning**                 | Expert     | Tu ré-entraînes un modèle sur tes données                                                        | ❌ Overkill, pas assez de données              |

### Comment fonctionne le Tool Use (Function Calling)

C'est LE concept clé pour ton AI Coach. Voici ce qui se passe exactement :

```
1. Tu envoies au LLM un message + une liste d'outils disponibles (schémas JSON)

2. Le LLM répond avec SOIT :
   a) Du texte normal (si pas besoin d'outil), OU
   b) Un appel d'outil : { tool: "get_workouts", args: { user_id: "123", days: 7 } }

3. TON CODE exécute la fonction (requête Supabase, calcul, etc.)

4. Tu renvoies le résultat au LLM comme "tool_result"

5. Le LLM continue à raisonner avec les nouvelles données
   (peut appeler un autre outil, ou produire la réponse finale)
```

**Exemple concret pour Halterofit :**

```
User: "Je stagne sur mon bench press, que faire?"

LLM pense: "J'ai besoin de voir son historique de bench"
→ tool_use: get_workouts({ exercise: "bench press", days: 60 })

TON CODE: requête Supabase → retourne 47 séances

LLM pense: "J'ai besoin de conseils scientifiques sur les plateaux"
→ tool_use: search_knowledge({ query: "plateau bench press solutions" })

TON CODE: embed la query → recherche pgvector → retourne 3 articles

LLM: "En regardant tes 47 dernières séances, ton volume de triceps
      est 62% plus bas que tes pecs. Selon Helms et al. (2015),
      un ratio agoniste/antagoniste < 0.6 est associé à des plateaux.
      Je recommande d'ajouter des close-grip bench press 3×8..."
```

### Agents vs Chatbots

| Chatbot                       | Agent                                                         |
| ----------------------------- | ------------------------------------------------------------- |
| Répond à un message à la fois | Planifie et exécute des tâches multi-étapes                   |
| Pas d'outils — juste du texte | A des outils (DB, API, fichiers)                              |
| Tu fournis tout le contexte   | Découvre le contexte en utilisant ses outils                  |
| `User → LLM → Réponse`        | `User → LLM → Outil → Observer → LLM → Outil → ... → Réponse` |

**Claude Code EST un agent.** Quand tu lui demandes "fix le test qui fail", il :

1. Lit le fichier de test (outil: Read)
2. Exécute le test (outil: Bash)
3. Lit l'erreur
4. Lit le fichier source (outil: Read)
5. Édite le code (outil: Edit)
6. Re-exécute le test (outil: Bash)
7. Confirme que ça passe → te répond

C'est la "boucle agentique" — un LLM dans un while loop qui appelle des outils jusqu'à ce que la tâche soit terminée.

### Skills, MCP, et la relation avec Claude Code

| Concept                          | Ce que c'est                                            | Analogie                                          |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| **System Prompt**                | Instructions statiques pour le LLM                      | Fiche de poste                                    |
| **MCP (Model Context Protocol)** | Connecte le LLM à des systèmes externes (API, DB)       | Donner des accès à quelqu'un                      |
| **Skills**                       | Domaine de connaissance + workflow chargé dynamiquement | Manuel de formation qui apparaît quand nécessaire |
| **CLAUDE.md**                    | Instructions projet toujours chargées                   | Le handbook de l'employé                          |

Les "skills" de Claude Code sont des dossiers contenant un `SKILL.md` avec des instructions. Quand tu donnes une tâche, Claude Code scanne les descriptions de skills disponibles et charge les pertinents. C'est du RAG de prompt en quelque sorte.

---

## Technologies concrètes pour le AI Coach

### Choix du LLM

| Fournisseur   | Modèle            | Input $/1M tokens | Output $/1M tokens | Pour Halterofit ?                            |
| ------------- | ----------------- | ----------------- | ------------------ | -------------------------------------------- |
| **Anthropic** | Claude Haiku 4.5  | $1.00             | $5.00              | Messages simples, FAQ                        |
| **Anthropic** | Claude Sonnet 4.5 | $3.00             | $15.00             | **Recommandé** — meilleur ratio qualité/prix |
| **OpenAI**    | GPT-4o-mini       | $0.15             | $0.60              | Alternative ultra-cheap                      |
| **OpenAI**    | GPT-4o            | $2.50             | $10.00             | Alternative solide                           |

**Recommandation :** Claude Sonnet 4.5 pour le coaching (meilleur raisonnement). GPT-4o-mini pour les interactions simples (20x moins cher).

### Framework d'orchestration

| Framework         | Pour                                                                               | Contre                                       | Verdict                                           |
| ----------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| **Vercel AI SDK** | TypeScript-natif, hooks React (`useChat`), streaming out-of-the-box, 25+ providers | Optimisé pour Next.js                        | ✅ **Recommandé**                                 |
| **LangChain.js**  | Écosystème massif, supporte tout                                                   | Heavy (~101KB), sur-abstrait, API changeante | ❌ Overkill                                       |
| **LlamaIndex**    | Best-in-class pour RAG                                                             | Plus limité que LangChain pour le reste      | ⚠️ Si le RAG devient complexe                     |
| **Direct API**    | Simple, zéro dépendance                                                            | Tu build tout toi-même                       | ⚠️ Pour apprendre, puis migrer vers Vercel AI SDK |

### Base vectorielle

**Utilise Supabase pgvector.** Tu as déjà Supabase. pgvector est une extension PostgreSQL native. Pas besoin de Pinecone/Weaviate. Tes données sont dans la même DB.

```sql
-- Activer l'extension
create extension if not exists vector;

-- Table de connaissances fitness
create table fitness_knowledge (
  id bigserial primary key,
  content text not null,
  source text,            -- "NSCA Guidelines Ch.12"
  category text,          -- "periodisation", "nutrition", "récupération"
  embedding vector(1536)  -- dimension du modèle d'embedding
);

-- Index pour recherche rapide
create index on fitness_knowledge
  using hnsw (embedding vector_cosine_ops);
```

### Modèle d'embedding

| Modèle                            | Dimensions | Prix / 1M tokens | Qualité                                 |
| --------------------------------- | ---------- | ---------------- | --------------------------------------- | ------------------------------- |
| **OpenAI text-embedding-3-small** | 1536       | $0.02            | Bon                                     | ✅ Recommandé (prix imbattable) |
| Cohere Embed v4                   | 1536       | $0.12            | Excellent (multilingue)                 |
| Voyage AI voyage-3                | 1024       | $0.06            | Excellent (meilleur ratio qualité/prix) |

---

## Coûts réalistes

### Par interaction (1 question → 1 réponse avec tool use)

| Composant                     | Tokens      | Coût (Claude Sonnet) |
| ----------------------------- | ----------- | -------------------- |
| System prompt                 | ~500 input  | $0.0015              |
| Message + historique          | ~1000 input | $0.003               |
| Définitions d'outils          | ~800 input  | $0.0024              |
| Résultats d'outils (2 appels) | ~2000 input | $0.006               |
| Réponse du LLM                | ~800 output | $0.012               |
| **Total par interaction**     | **~5100**   | **~$0.025**          |

### Par mois selon l'usage

| Usage                      | Interactions/mois | Coût LLM | Supabase       | Total   |
| -------------------------- | ----------------- | -------- | -------------- | ------- |
| **Dev/test** (toi seul)    | 100               | $2.50    | $0 (free tier) | ~$2.50  |
| **Early users** (50 users) | 7,500             | $187     | $25/mois       | ~$212   |
| **Growth** (500 users)     | 75,000            | $1,875   | $25/mois       | ~$1,900 |

### Optimisations de coûts

1. **Prompt caching** (Anthropic) : -90% sur le system prompt pour les messages suivants dans une conversation
2. **Routing** : messages simples → GPT-4o-mini ($0.15/1M), coaching complexe → Claude Sonnet
3. **Batch API** : -50% pour les tâches non-urgentes (génération de programmes hebdomadaires)

---

## Plan d'implémentation incrémental

Chaque étape build sur la précédente. Pas besoin de tout refaire.

```
SEMAINE 1 — Prompt Engineering seul
  Appelle Claude directement avec le profil user dans le system prompt.
  Pas de RAG, pas de tools. Juste un prompt bien crafté.
  → Tu as un AI coach fonctionnel pour du Q&A simple.

SEMAINE 2 — Ajoute le Tool Use
  Donne à Claude l'accès aux requêtes Supabase (historique de workouts,
  profil utilisateur). Maintenant le coach sait ce que l'user fait VRAIMENT.

SEMAINE 3 — Ajoute le Structured Output
  Active le JSON mode pour la génération de programmes.
  Le coach peut créer des programmes parsables par ton UI.

SEMAINE 4 — Ajoute le RAG
  Setup pgvector dans Supabase. Embed des articles de science du training.
  Le coach cite des études, ne hallucine plus.

SEMAINE 5 — Streaming UI
  Intègre le Vercel AI SDK (useChat) pour le streaming temps réel.

PLUS TARD — Agent loop (si nécessaire)
  Pour les workflows complexes multi-étapes.
```

---

## Repos et documentation clés

- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) — le framework recommandé
- [Anthropic Claude API](https://platform.claude.com/docs/en/home) — documentation LLM
- [Claude Tool Use](https://platform.claude.com/docs/en/build-with-claude/tool-use) — comment implémenter le function calling
- [Supabase pgvector](https://supabase.com/docs/guides/ai) — RAG dans ta DB existante
- [OpenAI Embeddings](https://platform.openai.com/docs/models/text-embedding-3-small) — modèle d'embedding recommandé

---

## Clarification : Un RAG n'est PAS un logiciel

Tu n'as PAS besoin de n8n, Microsoft AI Studio, LangFlow, Flowise, ou Dify.
Un RAG est un **pattern de code** que tu implémentes toi-même en TypeScript dans ton projet Next.js.

**Ce dont tu as réellement besoin :**

1. VS Code (ton IDE)
2. Un projet Next.js (`npx create-next-app@latest`)
3. Supabase avec pgvector activé (extension PostgreSQL)
4. Une clé API Anthropic (Claude) → console.anthropic.com
5. Une clé API OpenAI (embeddings) → platform.openai.com
6. npm packages : `ai @ai-sdk/anthropic openai @supabase/supabase-js`

**Point de départ recommandé :** Vercel AI SDK Quickstart → chat fonctionnel en 30 min, puis ajouter tool use, Supabase, et RAG progressivement.

---

# PARTIE 5 — Contexte projet pour nouvelle session Claude Code

> Ces sections permettent à une nouvelle session Claude Code d'avoir tout le contexte nécessaire pour créer un `CLAUDE.md` pertinent et démarrer le développement sans ambiguïté.

---

## Section 6 — Mobile App : Architecture existante

**Repo :** `C:\DevTools\Projects\Halterofit`
**Stack mobile :** React Native + Expo SDK 54, WatermelonDB (offline/SQLite), Supabase (cloud PostgreSQL)

### Schéma Supabase (8 tables actives — v8 complète)

```sql
-- users: profil utilisateur (lié à auth.users de Supabase)
users(
  id UUID PK → auth.users,
  email TEXT,
  preferred_unit TEXT ('kg'|'lbs'),
  default_rest_timer_seconds INTEGER DEFAULT 90
)

-- exercises: 1,300+ exercices ExerciseDB V1
exercises(
  id UUID PK,
  exercisedb_id TEXT UNIQUE,
  name TEXT,
  body_parts JSONB,          -- ex: ["back", "upper legs"]
  target_muscles JSONB,      -- ex: ["lats", "biceps"]
  secondary_muscles JSONB,
  equipments JSONB,          -- ex: ["barbell", "cable"]
  instructions JSONB,        -- tableau d'étapes
  description TEXT,
  difficulty TEXT ('beginner'|'intermediate'|'advanced'),
  category TEXT ('strength'|'cardio'|'stretching')
)

-- workouts: séances enregistrées
workouts(
  id UUID PK,
  user_id UUID → users,
  started_at BIGINT,        -- epoch ms
  completed_at BIGINT,      -- null si en cours
  duration_seconds INTEGER,
  title TEXT,
  notes TEXT,
  plan_id UUID → workout_plans,    -- nullable
  plan_day_id UUID → plan_days     -- nullable
)

-- workout_exercises: exercices dans une séance
workout_exercises(
  id UUID PK,
  workout_id UUID → workouts,
  exercise_id UUID → exercises,
  order_index INTEGER,
  superset_group TEXT,
  notes TEXT,
  target_sets INTEGER,
  target_reps INTEGER
)

-- exercise_sets: séries individuelles
exercise_sets(
  id UUID PK,
  workout_exercise_id UUID → workout_exercises,
  set_number INTEGER,
  reps INTEGER,
  weight REAL,
  duration_seconds INTEGER,
  distance REAL,
  rest_seconds INTEGER,
  set_type TEXT ('normal'|'warmup'|'dropset'|'failure'),
  is_completed BOOLEAN DEFAULT false,
  completed_at BIGINT
)

-- workout_plans: plans d'entraînement (templates)
workout_plans(
  id UUID PK,
  user_id UUID → users,
  name TEXT,
  is_active BOOLEAN,
  cover_image_url TEXT
)

-- plan_days: jours dans un plan
plan_days(
  id UUID PK,
  plan_id UUID → workout_plans,
  name TEXT,
  day_of_week TEXT,    -- 'MON'|'TUE'|... (optionnel)
  order_index INTEGER
)

-- plan_day_exercises: exercices template dans un jour
plan_day_exercises(
  id UUID PK,
  plan_day_id UUID → plan_days,
  exercise_id UUID → exercises,
  order_index INTEGER,
  target_sets INTEGER,
  target_reps INTEGER,
  target_weight REAL,
  target_duration_seconds INTEGER,
  rest_seconds INTEGER,
  notes TEXT
)
```

### Synchronisation WatermelonDB ↔ Supabase

- WatermelonDB = SQLite local offline-first (React Native)
- Sync bidirectionnelle custom via `supabase.from().select()` + `pullChanges/pushChanges`
- Timestamps `_changed`, `_status` sur chaque table pour la sync

### État du projet mobile (mars 2026)

- **Phase 1 — DONE** : Tracking de séances (workouts, exercises, sets)
- **Phase 2 — EN COURS** : Plans & Routines (workout_plans, plan_days, plan_day_exercises)
- **Phase 3 à 6 — Planifiées** : Social, Analytics, Nutrition, AI Coach (mobile)
- **Auth** : Tables prêtes (`users` lié à `auth.users`), UI auth pas encore implémentée
- **Pas de web companion** à ce jour

---

## Section 7 — CLAUDE.md template pour `halterofit` (monorepo)

Quand la nouvelle session Claude Code ouvre le monorepo, elle doit créer ce fichier à la racine.

```markdown
# Halterofit — Monorepo

## Structure

\`\`\`
apps/
mobile/ # React Native + Expo SDK 54
web/ # Next.js 16 + App Router
packages/
db/ # Types Supabase générés + schéma Drizzle
validators/ # Zod schemas partagés
types/ # TypeScript interfaces partagées
ui/ # shadcn/ui (web) + composants NativeWind (mobile)
tsconfig/ # Config TypeScript partagée
\`\`\`

## Package manager

pnpm (workspaces monorepo)

## Commandes globales

\`\`\`bash
pnpm dev # Lance tous les apps en parallèle (Turbo)
pnpm build # Build tous les packages + apps
pnpm lint # ESLint sur tout le monorepo
pnpm test # Tests sur tout le monorepo
\`\`\`

## Commandes par app

\`\`\`bash
pnpm --filter web dev # Next.js dev server
pnpm --filter mobile start # Expo dev server
\`\`\`

## Stack web (apps/web)

- Next.js 16, App Router, TypeScript strict
- Tailwind CSS v4 (zero-config via @tailwindcss/vite)
- Vercel AI SDK (useChat, useObject, streaming)
- Supabase (client: @supabase/ssr pour Next.js)
- shadcn/ui (composants)

## Stack mobile (apps/mobile)

- Expo SDK 54, React Native
- WatermelonDB (offline SQLite)
- Supabase (sync cloud)
- NativeWind v4 (Tailwind pour RN)

## Variables d'environnement requises (apps/web)

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # Server-side uniquement
ANTHROPIC_API_KEY= # Claude Sonnet 4.5
OPENAI_API_KEY= # Embeddings text-embedding-3-small
\`\`\`

## Conventions web (apps/web)

- Server Components par défaut, `"use client"` seulement si nécessaire
- Route handlers dans app/api/ pour les webhooks et Cron jobs
- AI routes : app/api/chat/route.ts (streaming) + app/api/coach/route.ts
- RAG pipeline dans lib/ai/ (embed.ts, retrieve.ts, context.ts)
- Types Supabase importés depuis @halterofit/db (package partagé)
- Zod validators importés depuis @halterofit/validators

## Architecture AI Coach

1. Utilisateur envoie message → useChat hook (Vercel AI SDK)
2. Route handler app/api/chat/route.ts reçoit le message
3. Tool calls → Supabase (historique séances, profil, PRs)
4. RAG → pgvector (fitness knowledge base)
5. Claude Sonnet 4.5 génère la réponse (streaming)
6. Response streamée → UI token par token

## Schéma Supabase

Voir docs/HALTEROFIT-WEB.md Section 6 pour le schéma complet.
Table pgvector à créer : fitness_knowledge(id, content, source, category, embedding vector(1536))

## Git workflow

- Branches : dev → main
- Commit format : type: description (feat, fix, chore, docs, test)
- CI : GitHub Actions (lint → test → build)
```

---

## Section 8 — Plan de développement (MVP 12 semaines)

### Phase 0 — Setup monorepo (Semaine 0, avant de commencer)

- [ ] Créer le monorepo Turborepo : `npx create-turbo@latest halterofit`
- [ ] Migrer `C:\DevTools\Projects\Halterofit` → `apps/mobile/`
- [ ] Créer `apps/web/` : `pnpm create next-app@latest web --typescript --tailwind --app`
- [ ] Créer `packages/db/` : `supabase gen types typescript --project-id <id> > index.ts`
- [ ] Créer `packages/validators/` : Zod schemas workout, user, exercise
- [ ] Setup CI/CD : GitHub Actions (lint → test → build)
- [ ] Déployer `apps/web` sur Vercel (auto-détecte monorepo)

### Phase 1 — Fondations web (Semaines 1-2)

- [ ] Auth : Supabase Auth + middleware Next.js (protected routes)
- [ ] Layout : Navbar, Footer, structure App Router
- [ ] Pages publiques : Landing page, About Halterofit, Download CTA
- [ ] Dashboard basique : `/dashboard` (authentifié) — statistiques sommaires
- [ ] Connexion Supabase côté serveur : `createServerClient` de @supabase/ssr

### Phase 2 — Pages exercices SEO (Semaines 3-4)

- [ ] Route `/exercises` — liste paginée (RSC, filtres par muscle/équipement)
- [ ] Route `/exercises/[slug]` — page individuelle par exercice (RSC + ISR)
- [ ] `generateMetadata()` pour chaque exercice (SEO, OpenGraph)
- [ ] Sitemap.xml dynamique (1,300+ exercices)
- [ ] Images : GIFs ExerciseDB via Supabase Storage ou CDN

### Phase 3 — Dashboard Analytics (Semaines 5-6)

- [ ] Graphiques : volume par semaine, fréquence musculaire, progression en force
- [ ] PRs (personal records) : meilleur poids par exercice
- [ ] Calendrier de workouts (heatmap style GitHub)
- [ ] Export CSV des données (optionnel)
- [ ] Library : Recharts ou Tremor (léger, RSC-compatible)

### Phase 4 — RAG Knowledge Base (Semaines 7-8)

- [ ] Activer pgvector sur Supabase : `CREATE EXTENSION IF NOT EXISTS vector`
- [ ] Créer la table `fitness_knowledge` avec HNSW index
- [ ] Ingestion : scraper/importer articles de science du training (PubMed, Stronger by Science, etc.)
- [ ] Script d'embedding : chunker → OpenAI text-embedding-3-small → pgvector
- [ ] Fonction de retrieval : `match_documents(query_embedding, threshold, count)`
- [ ] Tester la précision du retrieval sur 20 questions fitness

### Phase 5 — AI Coach v1 Réactif (Semaines 9-10)

- [ ] Route `/api/chat` : streaming handler avec Vercel AI SDK
- [ ] Tool definitions : `get_user_workouts`, `get_exercise_history`, `get_user_prs`
- [ ] System prompt : contexte utilisateur + instructions coaching
- [ ] RAG intégration : embed la question → retrieve chunks → inject dans prompt
- [ ] UI : chat flottant avec `useChat` hook, streaming token-by-token
- [ ] Garde-fous : max 3 tool calls, timeout 30s, fallback gracieux

### Phase 6 — AI Coach v2 Proactif (Semaines 11-12)

- [ ] Vercel Cron Job : `/api/cron/weekly-digest` (chaque lundi 8h)
- [ ] Digest personnalisé : 5 séances précédentes → Claude → insights → DB
- [ ] Notification : email (Resend) ou notification push (Expo Push Notifications)
- [ ] Page `/digest` : liste des digests historiques par utilisateur
- [ ] Détection automatique : surcharge, déséquilibre musculaire, PR proche

### Post-MVP (après 12 semaines)

- TDEE Calculator adaptatif (estimation calorique ajustée selon workouts)
- Body fat estimation : Navy Method d'abord, photo par vision LLM en V2
- Partage social de workouts (OG images dynamiques via `@vercel/og`)
- Plans d'entraînement publics (page `/plans/[slug]`)
- Sync bidirectionnelle temps réel web ↔ mobile (Supabase Realtime)

---

## Section 9 — Stratégie SEO exercices

**Objectif :** Reproduire l'effet MuscleWiki (1M+ visits/mois grâce aux pages d'exercices gratuites).

### Architecture des pages

```
/exercises                    → Liste filtrée, paginée (RSC)
/exercises/[slug]             → Page individuelle (RSC + ISR)
  ex: /exercises/barbell-squat
      /exercises/pull-up
      /exercises/romanian-deadlift
```

### Contenu de chaque page exercice (RSC)

```tsx
// app/exercises/[slug]/page.tsx
export const revalidate = 86400; // ISR: régénère chaque 24h

export async function generateMetadata({ params }) {
  const exercise = await getExercise(params.slug);
  return {
    title: `${exercise.name} — Technique, Muscles, Variations | Halterofit`,
    description: `Apprenez à faire ${exercise.name} correctement. Muscles ciblés: ${exercise.target_muscles.join(', ')}. Instructions étape par étape.`,
    openGraph: { images: [exercise.gif_url] },
  };
}
```

Contenu RSC par page :

- Nom de l'exercice + catégorie
- GIF animé (ExerciseDB)
- Muscles ciblés (heatmap SVG) + muscles secondaires
- Instructions étape par étape (depuis Supabase)
- Équipement nécessaire
- Niveau de difficulté
- Exercices similaires (linking interne SEO)
- CTA : "Ajouter à Halterofit" (deep link vers l'app)

### Sitemap

```tsx
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const exercises = await supabase.from('exercises').select('exercisedb_id, name, updated_at');
  return exercises.data.map((ex) => ({
    url: `https://halterofit.com/exercises/${slugify(ex.name)}`,
    lastModified: new Date(ex.updated_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));
}
```

### Mots-clés cibles (exemples)

- "barbell squat technique" — 40K searches/mois
- "pull up muscles worked" — 22K searches/mois
- "romanian deadlift form" — 18K searches/mois
- Long tail: "how many sets of bench press per week" → AI Coach répond

---

## Section 10 — UX de l'AI Coach

### Mode Réactif (chat à la demande)

```
User: "Pourquoi j'ai pas progressé sur mon bench ce mois?"

Pipeline:
1. useChat hook → POST /api/chat
2. Claude reçoit message + system prompt avec profil user
3. Tool call: get_user_workouts(last_30_days) → Supabase
4. Tool call: get_exercise_history(exercise="bench press") → Supabase
5. RAG: embed("bench press progression plateau") → pgvector → 3 chunks science
6. Claude génère réponse grounded dans les vrais chiffres + science
7. Stream token-by-token vers le UI

Réponse exemple:
"Sur les 30 derniers jours, tu as fait 8 séances de bench avec une moyenne
de 3.2 sets. Ton volume hebdo est passé de 24 → 19 sets (↓21%). La science
du training (Schoenfeld 2017) montre qu'un volume ≥18 sets/semaine est
nécessaire pour la progression en hypertrophie. Solution: ajoute 1 set par
séance pendant 2 semaines."
```

### Mode Proactif (digest hebdomadaire)

```
Cron: chaque lundi 8h → /api/cron/weekly-digest

Pour chaque user actif (≥1 workout cette semaine):
1. Fetch: 7 derniers workouts depuis Supabase
2. Calcul: volume/muscle, fréquence, nouveaux PRs
3. RAG: "récupération musculaire" si volume élevé
4. Claude génère le digest (JSON structuré)
5. Sauvegarde dans table user_digests
6. Email via Resend (ou push via Expo)

Format du digest:
{
  "week_summary": "Bonne semaine — 4 séances, 12 tonnes soulevées",
  "highlights": ["Nouveau PR deadlift: 130kg", "Volume dos +15%"],
  "alerts": ["Pectoraux: seulement 2 séances cette semaine"],
  "recommendation": "Focus chest mardi. Objectif: 4 sets bench ≥80kg.",
  "next_week_plan": { ... }
}
```

### Tool Definitions (Vercel AI SDK)

```typescript
// lib/ai/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const getUserWorkouts = tool({
  description: 'Retrieve user workout history for a given period',
  parameters: z.object({
    days: z.number().max(90).describe('Number of past days to retrieve'),
  }),
  execute: async ({ days }, { userId }) => {
    const since = Date.now() - days * 86400 * 1000;
    return await supabase
      .from('workouts')
      .select('*, workout_exercises(*, exercise_sets(*), exercises(name))')
      .eq('user_id', userId)
      .gte('started_at', since)
      .order('started_at', { ascending: false });
  },
});

export const getUserPRs = tool({
  description: 'Get personal records (best weight) per exercise',
  parameters: z.object({
    exercise_name: z.string().optional(),
  }),
  execute: async ({ exercise_name }, { userId }) => {
    /* ... */
  },
});
```

### Garde-fous et limites

| Paramètre      | Valeur                               | Raison                      |
| -------------- | ------------------------------------ | --------------------------- |
| Max tool calls | 3 par requête                        | Éviter les boucles infinies |
| Timeout        | 30 secondes                          | UX (le user attend)         |
| Context window | 50K tokens max                       | Coût + performance          |
| Rate limit     | 20 req/user/heure                    | Abus                        |
| Fallback       | "Je ne peux pas répondre maintenant" | LLM down                    |

---

## Section 11 — Body Fat Estimation (R&D, post-MVP)

### Approche recommandée pour le MVP : Navy Method (sans photo)

**Formule Navy Method** (US Navy, 1984) — précision ±3% :

```
Hommes:   BF% = 495 / (1.0324 - 0.19077×log10(taille-cou) + 0.15456×log10(taille)) - 450
Femmes:   BF% = 495 / (1.29579 - 0.35004×log10(taille+hanches-cou) + 0.22100×log10(taille)) - 450

Inputs: taille (cm), tour de cou (cm), tour de taille (cm), tour de hanches (cm, femmes)
```

Avantages : aucune photo, aucun LLM, zéro coût, précision acceptable.
Implémentation : formulaire simple → calcul côté client → stockage Supabase.

### Approche V2 : Photo + Vision LLM (post-MVP)

**Faisabilité :** Moyenne. Les LLMs (Claude Vision, GPT-4o) peuvent estimer le BF% par photo mais avec des limitations majeures :

- Précision : ±5-8% (vs ±3% Navy Method)
- Facteurs de bruit : éclairage, vêtements, pose, pump post-workout
- Données d'entraînement LLM sur photos corporelles = biaisées

**Pipeline envisagé :**

1. User upload photo → Supabase Storage (privé, RLS strict)
2. Route server-side → Claude Vision API (`claude-sonnet-4-5-20251022` avec vision)
3. System prompt : "Estimate body fat percentage based on visible muscle definition, body proportions, and skin fold appearance. Return JSON: {estimate: number, confidence: 'low'|'medium', notes: string}"
4. Résultat affiché avec large intervalle de confiance (±5%)
5. Calibration : comparer Navy Method vs photo sur même date → améliorer le prompt

**Considérations légales :**

- RGPD : photos corporelles = données sensibles (catégorie spéciale)
- Consentement explicite requis
- Politique de rétention claire (supprimer après X jours?)
- Stocker uniquement le résultat, pas la photo (option privacy-first)

**Recommandation finale :** Navy Method dans MVP. Photo en V2 seulement si les users le demandent explicitement.

---

## Section 12 — Décisions de stack : Supabase vs alternatives

> Recherche faite en mars 2026. Chiffres vérifiés.

### Supabase — Bottlenecks réels

| Limite                    | Valeur                | Quand ça frappe               |
| ------------------------- | --------------------- | ----------------------------- |
| Connexions DB (Supavisor) | 30 simultanées        | >500 users concurrents        |
| pgvector performance      | Optimal <10M vecteurs | Jamais pour fitness knowledge |
| MAU inclus (Pro $25/mo)   | 100K MAU              | Après 12-18 mois d'adoption   |
| Overage MAU               | $3.25/1000 MAU        | Coûteux >200K MAU             |

**Verdict :** Supabase est le bon choix pour 0 → 100K users. L'investissement existant (mobile app) + pgvector intégré + Auth + Storage = imbattable au niveau MVP.

**Migration future si nécessaire :** Neon (serverless PostgreSQL, même SQL, migration directe).

### pgvector — Sizing pour RAG fitness

- Knowledge base visée : 1,000 → 50,000 chunks
- Dimensions : 1536 (OpenAI text-embedding-3-small)
- Stockage : 50K × 1536 × 4 bytes = 300 MB raw, ~900 MB avec index HNSW
- Latence : 10-30ms par requête (excellent)
- Limite réelle : 10M vecteurs — 200x au-dessus de notre besoin

**Config HNSW recommandée :**

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE fitness_knowledge (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  source TEXT,                -- ex: "Schoenfeld 2017 — Hypertrophy Review"
  category TEXT,              -- ex: "hypertrophy" | "nutrition" | "recovery"
  embedding VECTOR(1536)
);

CREATE INDEX ON fitness_knowledge USING HNSW (embedding VECTOR_COSINE_OPS)
WITH (m=16, ef_construction=128);

-- Fonction de retrieval
CREATE OR REPLACE FUNCTION match_fitness_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id BIGINT, content TEXT, source TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, content, source,
    1 - (embedding <=> query_embedding) AS similarity
  FROM fitness_knowledge
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### Monorepo (Turborepo) vs repos séparés — Décision finale

**Verdict : Monorepo Turborepo** (décision prise mars 2026)

Recherche 2025-2026 confirmée :

- Expo SDK 52+ auto-détecte les monorepos (zero config Metro)
- Turborepo réécrit en Rust — fiable en production
- Template T3 Turbo = Next.js + Expo + Supabase prêts à l'emploi

**Template de référence :** https://github.com/t3-oss/create-t3-turbo

**Ce qui est partagé :**

- `packages/db` : types Supabase auto-générés (`supabase gen types`) ← **le killer feature**
- `packages/validators` : Zod schemas (workout, user, exercise)
- `packages/types` : interfaces TypeScript communes
- `packages/tsconfig` : config TypeScript stricte partagée

**Coût de migration mobile → monorepo :** 1-2 jours (une seule fois)
**Gain sur 6 mois :** zéro désync de types, un seul `git clone`, CI unifiée
