# Effector-pagination

Simple factory to create pagination with less boilerplate

## Installation

```bash
npm install effector-pagination
```

## Usage

```tsx
export const someRequestFx = createEffect(
  (params: { limit: number; offset: number }) => {
    return {
      list: await fetch(/* ... */),
    };
  }
);

export const pagination = createPagination({
  /* Items per page. You can also pass Store<number> here */
  limit: 20,
  /* Effect that will do fetching */
  effect: someRequestFx,
  /* Convert library's page and limit into effect params */
  mapParams: ({ page, limit }) => ({ params: { limit, offset: page * limit } }),
  /* Map effect result to extract list */
  mapResult: ({ list }) => list,
});

pagination.$page; // Store<number> - Current page
pagination.$pages; // Store<Record<number, Item[]>> - All loaded items split by page numbers
pagination.$allItems; // Store<Item[]> - All loaded items combined
pagination.$canGoPrev; // Store<boolean> - Can go to the previous page?
pagination.$canGoNext; // Store<boolean> - Can go to the next page?
pagination.$pending; // Store<boolean> - Is currently pending?
pagination.goToPageFx; // Effect<{ page: number }, Item[]> - Load specific page
pagination.nextFx; // Effect<void, Item[]> - Load next page
pagination.prevFx; // Effect<void, Item[]> - Load prev page
pagination.reset; // Event<void> - Resets all the state, cleans up all loaded items
```
