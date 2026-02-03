

## Plan : Remplacer les Favicons par le nouveau logo "AV"

### Objectif
Remplacer les deux fichiers favicon (`favicon.png` et `favicon.ico`) par le nouveau logo "Artisans Validés" fourni, afin que Google et tous les navigateurs affichent le bon favicon.

---

### Fichiers à Modifier

| Action | Fichier |
|--------|---------|
| Copier | `user-uploads://515009827_122096828732936004_5621965651479597976_n.jpg` → `public/favicon.png` |
| Copier | `user-uploads://515009827_122096828732936004_5621965651479597976_n.jpg` → `public/favicon.ico` |

---

### Détails Techniques

1. **Copier le logo vers `public/favicon.png`**
   - Remplace l'ancien fichier PNG par le nouveau logo AV

2. **Copier le logo vers `public/favicon.ico`**
   - Remplace le favicon Lovable (cœur) par le nouveau logo AV
   - C'est ce fichier que Google indexait à tort

3. **Vérification `index.html`**
   - La balise `<link rel="icon" href="/favicon.png" type="image/png" />` est déjà correcte
   - Aucune modification nécessaire dans le HTML

---

### Note importante pour Google

Après le déploiement, Google peut mettre **plusieurs semaines** à réindexer le nouveau favicon. Pour accélérer le processus :
- Utiliser Google Search Console pour demander une réindexation de la page d'accueil
- Le cache de Google finira par se mettre à jour automatiquement

---

### Temps Estimé
- 2 minutes

