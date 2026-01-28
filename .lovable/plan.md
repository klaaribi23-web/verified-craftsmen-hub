

## Plan : Standardiser les Actions Admin pour tous les Artisans

### Objectif
Uniformiser les boutons d'action (Voir, Modifier, Supprimer) sur toutes les listes d'artisans du dashboard admin `/admin/approbations`.

---

### Résumé des Changements

| Tab | Actuellement | Après |
|-----|--------------|-------|
| Vitrines actives | Voir ✅ Modifier ✅ Supprimer ✅ | Voir ✅ Modifier ✅ Supprimer ✅ (inchangé) |
| Vitrines en attente | Voir ✅ Modifier ❌ Supprimer ✅ | Voir ✅ Modifier ✅ Supprimer ✅ |
| Vitrines confirmées | Voir ✅ Modifier ❌ Supprimer ❌ | Voir ✅ Modifier ✅ Supprimer ✅ |
| Nouvelles inscriptions | Voir ❌ Modifier ❌ Supprimer ✅ | Voir ✅ Modifier ✅ Supprimer ✅ |
| Documents en attente | Voir ✅ Modifier ❌ Supprimer ❌ | Voir ✅ Modifier ✅ Supprimer ✅ |

---

### Fichiers à Modifier

| Fichier | Modifications |
|---------|---------------|
| `AdminEditArtisanDialog.tsx` | Adapter l'interface pour accepter tous les types d'artisans et gérer `email` ou `profile.email` |
| `AdminApprovals.tsx` | Ajouter un type union, renommer `editProspect` en `editArtisan`, ajouter les boutons manquants et les dialogues associés |

---

### Détails Techniques

#### 1. AdminEditArtisanDialog.tsx

**Problème** : Le composant attend un `email` direct, mais certains types d'artisans utilisent `profile.email`.

**Solution** : Créer une interface plus flexible et extraire l'email intelligemment.

```typescript
// Nouvelle interface flexible
interface ArtisanData {
  id: string;
  business_name: string;
  email?: string | null;  // Email direct (pour prospects, waiting)
  profile?: {             // Email imbriqué (pour pending, claimed, self-signup)
    email?: string;
  } | null;
  // ... autres champs existants
}
```

**Modification du useEffect** :
```typescript
// Extraire l'email du bon endroit
const artisanEmail = artisan.email || artisan.profile?.email || null;
setFormData(prev => ({
  ...prev,
  email: artisanEmail,
  // ...
}));
```

#### 2. AdminApprovals.tsx

**2.1 Créer un type union pour l'édition**

```typescript
// Nouveau type union pour tous les artisans éditables
type EditableArtisan = ProspectArtisan | WaitingArtisan | ClaimedArtisan | SelfSignupArtisan | PendingArtisan;
```

**2.2 Renommer l'état**

```typescript
// Avant
const [editProspect, setEditProspect] = useState<ProspectArtisan | null>(null);

// Après
const [editArtisan, setEditArtisan] = useState<EditableArtisan | null>(null);
```

**2.3 Nouveaux états pour les suppressions**

```typescript
// Pour Vitrines confirmées
const [claimedArtisanToDelete, setClaimedArtisanToDelete] = useState<ClaimedArtisan | null>(null);
const [isDeletingClaimed, setIsDeletingClaimed] = useState(false);

// Pour Documents en attente  
const [pendingArtisanToDelete, setPendingArtisanToDelete] = useState<PendingArtisan | null>(null);
const [isDeletingPending, setIsDeletingPending] = useState(false);
```

**2.4 Ajouter les boutons manquants par section**

##### Vitrines en attente (waitingArtisans) - Ajouter "Modifier"
```tsx
<Button 
  variant="outline" 
  size="sm" 
  onClick={() => {
    setEditArtisan(artisan);
    setEditDialogOpen(true);
  }}
>
  <Pencil className="h-3.5 w-3.5 mr-1.5" />
  Modifier
</Button>
```

##### Vitrines confirmées (claimedArtisans) - Ajouter "Modifier" et "Supprimer"
```tsx
<Button 
  variant="outline" 
  size="sm"
  onClick={() => {
    setEditArtisan(artisan);
    setEditDialogOpen(true);
  }}
>
  <Pencil className="h-3.5 w-3.5 mr-1.5" />
  Modifier
</Button>
<Button 
  variant="destructive" 
  size="sm"
  onClick={() => {
    setClaimedArtisanToDelete(artisan);
    setShowDeleteClaimedDialog(true);
  }}
>
  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
  Supprimer
</Button>
```

##### Nouvelles inscriptions (selfSignupArtisans) - Ajouter "Voir" et "Modifier"
```tsx
<Button 
  variant="outline" 
  size="sm"
  onClick={() => window.open(`/artisan/${artisan.slug}`, '_blank')}
  disabled={!artisan.slug}
>
  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
  Voir
</Button>
<Button 
  variant="outline" 
  size="sm"
  onClick={() => {
    setEditArtisan(artisan);
    setEditDialogOpen(true);
  }}
>
  <Pencil className="h-3.5 w-3.5 mr-1.5" />
  Modifier
</Button>
```

##### Documents en attente (pendingArtisans) - Ajouter "Modifier" et "Supprimer"
```tsx
<Button 
  variant="outline" 
  size="sm"
  onClick={() => {
    setEditArtisan(artisan);
    setEditDialogOpen(true);
  }}
>
  <Pencil className="h-3.5 w-3.5 mr-1.5" />
  Modifier
</Button>
<Button 
  variant="destructive" 
  size="sm"
  onClick={() => {
    setPendingArtisanToDelete(artisan);
    setShowDeletePendingDialog(true);
  }}
>
  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
  Supprimer
</Button>
```

**2.5 Ajouter les nouveaux AlertDialogs de suppression**

- AlertDialog pour `claimedArtisanToDelete` (Vitrines confirmées)
- AlertDialog pour `pendingArtisanToDelete` (Documents en attente)

Ces deux dialogues utiliseront l'Edge Function `admin-delete-waiting-artisan` pour la suppression complète.

**2.6 Mettre à jour le composant AdminEditArtisanDialog**

```tsx
<AdminEditArtisanDialog 
  open={editDialogOpen} 
  onOpenChange={(open) => {
    setEditDialogOpen(open);
    if (!open) {
      setEditArtisan(null);
      // Invalider toutes les queries pertinentes
      queryClient.invalidateQueries({ queryKey: ["prospect-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["waiting-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["claimed-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["self-signup-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-artisans"] });
    }
  }} 
  artisan={editArtisan as any} 
/>
```

---

### Ce qui ne change pas

- La logique de suppression via `admin-delete-waiting-artisan` Edge Function reste identique
- Les vitrines actives gardent leur comportement actuel
- Les dialogs de confirmation existants (delete waiting, delete self-signup) restent inchangés
- Les notifications et emails restent identiques

---

### Temps Estimé

- Modifications `AdminEditArtisanDialog.tsx` : 10 minutes
- Modifications `AdminApprovals.tsx` : 25 minutes
- Tests : 10 minutes
- **Total : 45 minutes**

