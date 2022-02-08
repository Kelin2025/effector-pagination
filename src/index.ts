import {
  is,
  attach,
  combine,
  createEvent,
  createStore,
  Effect,
  EffectParams,
  EffectResult,
  sample,
  Store,
} from 'effector';

type PaginationOptions<Item, Eff extends Effect<any, any, any>> = {
  limit: number | Store<number>;
  effect: Eff;
  mapParams?: (params: { page: number; limit: number }) => EffectParams<Eff>;
  mapResult?: (result: EffectResult<Eff>) => Item[];
};

export const createPagination = <Item, Eff extends Effect<any, any, any>>(
  options: PaginationOptions<Item, Eff>
) => {
  const $page = createStore(0);
  const $pages = createStore<Record<string, Item[]>>({});
  const $limit = toStore(options.limit);

  const $currentItems = combine(
    $pages,
    $page,
    (pages, page) => pages[page] ?? []
  );
  const $allItems = $pages.map(pages => {
    return Object.keys(pages).reduce((list, curPage) => {
      list.push(...pages[curPage]);
      return list;
    }, [] as Item[]);
  });

  const $canGoPrev = $page.map(page => page > 1);
  const $canGoNext = createStore(true);

  const loadFx = attach({
    effect: options.effect,
    mapParams: options.mapParams || (payload => payload),
  });

  const itemsLoaded = sample({
    clock: loadFx.done,
    source: $limit,
    fn: (limit, { params, result }) => {
      const items = (options.mapResult
        ? options.mapResult(result)
        : result) as Item[];
      return {
        page: params.page,
        items,
        canGoNext: items.length >= limit,
      };
    },
  });

  $pages.on(itemsLoaded, (pages, { page, items }) => ({
    ...pages,
    [page]: items,
  }));

  $canGoNext.on(itemsLoaded, (_prev, { canGoNext }) => canGoNext);

  const goToPageFx = attach({
    effect: loadFx,
    source: { limit: $limit },
    mapParams: ({ page }: { page: number }, { limit }) => ({ page, limit }),
  });

  $page.on(goToPageFx, (_prev, { page }) => page);

  const nextFx = attach({
    effect: goToPageFx,
    source: { page: $page.map(page => page + 1) },
  });

  const prevFx = attach({
    effect: goToPageFx,
    source: { page: $page.map(page => page - 1) },
  });

  const reset = createEvent();

  $page.reset(reset);
  $pages.reset(reset);

  return {
    $page,
    $pages,
    $currentItems,
    $allItems,
    $canGoPrev,
    $canGoNext,
    $pending: loadFx.pending,
    goToPageFx,
    nextFx,
    prevFx,
    reset,
  };
};

const toStore = <T>(value: T | Store<T>): Store<T> => {
  if (is.store(value)) {
    return value;
  }
  return createStore(value as T);
};
