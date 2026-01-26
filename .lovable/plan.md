

## Plan : Réduction des Documents Obligatoires de 4 à 3

### Objectif
Supprimer le document "Pièce d'identité (recto/verso)" de la liste des documents obligatoires. L'artisan devra désormais télécharger **3 documents** au lieu de 4 pour déclencher l'approbation.

---

### Fichiers à Modifier

| Fichier | Modification |
|---------|-------------|
| `src/pages/artisan/ArtisanDocuments.tsx` | Supprimer l'entrée "identite" du tableau `REQUIRED_DOCUMENTS` et de `mandatoryDocIds` |
| `src/pages/artisan/ArtisanDashboard.tsx` | Modifier `MANDATORY_DOC_IDS` et `TOTAL_MANDATORY_DOCS` (4 → 3) |
| `src/hooks/useApprovalCounts.ts` | Supprimer "identite" de `MANDATORY_DOC_IDS` |
| `src/pages/admin/AdminApprovals.tsx` | Supprimer "identite" de `MANDATORY_DOC_IDS` et du helper `getDocumentLabel` |
| `src/components/artisan-dashboard/ProfileCompletionCard.tsx` | Mettre à jour le texte "RC Pro, Décennale, KBIS" (sans la pièce d'identité) |
| `src/pages/ArtisanPublicProfile.tsx` | Mettre à jour le tooltip de vérification (sans mention de pièce d'identité) |
| **Migration SQL** | Modifier la fonction `count_mandatory_documents` pour compter 3 documents au lieu de 4, et la politique RLS pour vérifier `>= 3` |

---

### Détails des Modifications

#### 1. ArtisanDocuments.tsx (lignes 38-66 et 197)

**Supprimer l'entrée "identite"** du tableau `REQUIRED_DOCUMENTS` :
```typescript
// SUPPRIMER ces lignes (60-66) :
{
  id: "identite",
  name: "Pièce d'identité (recto/verso)",
  description: "Carte d'identité ou passeport valide",
  required: true,
  icon: CreditCard
},
```

**Modifier la liste `mandatoryDocIds` (ligne 197)** :
```typescript
// AVANT :
const mandatoryDocIds = ["rc_pro", "decennale", "kbis", "identite"];

// APRÈS :
const mandatoryDocIds = ["rc_pro", "decennale", "kbis"];
```

#### 2. ArtisanDashboard.tsx (lignes 123-124)

```typescript
// AVANT :
const MANDATORY_DOC_IDS = ["rc_pro", "decennale", "kbis", "identite"];
const TOTAL_MANDATORY_DOCS = 4;

// APRÈS :
const MANDATORY_DOC_IDS = ["rc_pro", "decennale", "kbis"];
const TOTAL_MANDATORY_DOCS = 3;
```

#### 3. useApprovalCounts.ts (ligne 5)

```typescript
// AVANT :
const MANDATORY_DOC_IDS = ["rc_pro", "decennale", "kbis", "identite"];

// APRÈS :
const MANDATORY_DOC_IDS = ["rc_pro", "decennale", "kbis"];
```

#### 4. AdminApprovals.tsx (lignes 273 et 677-681)

```typescript
// AVANT (ligne 273) :
const MANDATORY_DOC_IDS = ["rc_pro", "decennale", "kbis", "identite"];

// APRÈS :
const MANDATORY_DOC_IDS = ["rc_pro", "decennale", "kbis"];
```

**Supprimer "identite" du helper `getDocumentLabel`** :
```typescript
// AVANT :
const labels: Record<string, string> = {
  rc_pro: "RC Professionnelle",
  decennale: "Assurance Décennale",
  kbis: "Extrait KBIS",
  identite: "Pièce d'identité"
};

// APRÈS :
const labels: Record<string, string> = {
  rc_pro: "RC Professionnelle",
  decennale: "Assurance Décennale",
  kbis: "Extrait KBIS"
};
```

#### 5. ProfileCompletionCard.tsx (ligne 187)

```typescript
// AVANT :
: "RC Pro, Décennale, KBIS, Pièce d'identité"

// APRÈS :
: "RC Pro, Décennale, KBIS"
```

#### 6. ArtisanPublicProfile.tsx (ligne 775)

```typescript
// AVANT :
<p>RC Pro, garantie décennale, KBIS et pièce d'identité vérifiés par notre équipe de modération.</p>

// APRÈS :
<p>RC Pro, garantie décennale et KBIS vérifiés par notre équipe de modération.</p>
```

#### 7. Migration SQL (Base de données)

Modifier la fonction `count_mandatory_documents` et la politique RLS :

```sql
-- Mettre à jour la fonction pour ne compter que 3 documents
CREATE OR REPLACE FUNCTION public.count_mandatory_documents(p_artisan_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT name)::integer
  FROM public.artisan_documents
  WHERE artisan_id = p_artisan_id
    AND name IN ('rc_pro', 'decennale', 'kbis')  -- Suppression de 'identite'
$$;

-- Recréer la politique RLS pour vérifier >= 3 documents
DROP POLICY IF EXISTS "Artisans can update their own profile" ON public.artisans;

CREATE POLICY "Artisans can update their own profile"
ON public.artisans
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  CASE 
    WHEN status = 'pending' THEN 
      public.count_mandatory_documents(id) >= 3  -- Changé de 4 à 3
    ELSE 
      true
  END
);
```

---

### Résumé des Changements

| Élément | Avant | Après |
|---------|-------|-------|
| Documents obligatoires | 4 (RC Pro, Décennale, KBIS, Identité) | 3 (RC Pro, Décennale, KBIS) |
| Déclenchement approbation | 4 documents | 3 documents |
| Interface artisan | Affiche 4 documents obligatoires | Affiche 3 documents obligatoires |
| Fonction SQL `count_mandatory_documents` | Compte 4 types | Compte 3 types |
| Politique RLS | Vérifie `>= 4` | Vérifie `>= 3` |

---

### Ce qui ne change pas

- Le document "Certifications" reste **facultatif**
- Le flow d'approbation admin reste identique
- Les notifications restent identiques
- Le stockage des fichiers reste identique
- Les artisans existants avec 4 documents ne sont pas impactés

---

### Temps Estimé
- Modifications frontend : **15 minutes**
- Migration SQL : **5 minutes**
- Tests : **10 minutes**
- **Total : 30 minutes**

