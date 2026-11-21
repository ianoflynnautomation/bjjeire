package com.bjjeire.api.product;

/** One size as a visitor sees it: what can be bought, never the stock or what is held (#6002). */
public record ProductSizeDto(SizeId id, int available, boolean soldOut) {}
