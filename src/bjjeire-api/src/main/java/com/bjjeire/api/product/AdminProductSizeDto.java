package com.bjjeire.api.product;

/** One size as the organiser sees it: the stock, what unpaid checkouts hold, and what is left to sell. */
public record AdminProductSizeDto(SizeId id, int stock, int held, int available, boolean soldOut) {}
