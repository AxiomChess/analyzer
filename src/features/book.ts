import { OPENING_BOOK_V1_LINES, OPENING_BOOK_V1_META } from "./book-data.js"
import type { BookBoundary, OpeningBookMeta } from "./types.js"

export type OpeningBook = {
  readonly meta: OpeningBookMeta
  readonly prefixes: ReadonlySet<string>
}

const buildPrefixes = (lines: readonly string[]): ReadonlySet<string> => {
  const prefixes = new Set<string>()
  for (const line of lines) {
    const moves = line.trim().split(/\s+/).filter(Boolean)
    for (let i = 1; i <= moves.length; i += 1) {
      prefixes.add(moves.slice(0, i).join(" "))
    }
  }
  return prefixes
}

export const OPENING_BOOK_V1: OpeningBook = {
  meta: OPENING_BOOK_V1_META,
  prefixes: buildPrefixes(OPENING_BOOK_V1_LINES),
}

export const getOpeningBook = (bookId = OPENING_BOOK_V1_META.id): OpeningBook => {
  if (bookId === OPENING_BOOK_V1_META.id) {
    return OPENING_BOOK_V1
  }
  throw new Error(`Unknown opening book id: ${bookId}`)
}

/**
 * Find how many leading plies stay on a book prefix path.
 * `playedUciMoves` are in play order (ply 1 first).
 */
export const findBookBoundary = (
  playedUciMoves: readonly string[],
  book: OpeningBook = OPENING_BOOK_V1,
): BookBoundary => {
  let bookPlyCount = 0

  for (let i = 0; i < playedUciMoves.length; i += 1) {
    const path = playedUciMoves.slice(0, i + 1).join(" ")
    if (!book.prefixes.has(path)) {
      break
    }
    bookPlyCount = i + 1
  }

  const noveltyPly =
    bookPlyCount < playedUciMoves.length ? bookPlyCount + 1 : null

  return {
    bookId: book.meta.id,
    bookPlyCount,
    noveltyPly,
  }
}
