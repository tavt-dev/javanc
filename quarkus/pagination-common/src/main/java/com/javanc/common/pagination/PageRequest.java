package com.javanc.common.pagination;

import java.util.Set;

public record PageRequest(int page, int size, String sortField, SortDirection direction) {

    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    public static PageRequest resolve(Integer page, Integer size, String sort, String defaultSort,
            Set<String> allowedSortFields) {
        int resolvedPage = page == null ? DEFAULT_PAGE : page;
        int resolvedSize = size == null ? DEFAULT_SIZE : size;
        if (resolvedPage < 0 || resolvedSize < 1 || resolvedSize > MAX_SIZE) {
            throw new IllegalArgumentException("Invalid pagination");
        }
        String requestedSort = sort == null || sort.isBlank() ? defaultSort : sort.trim();
        String[] parts = requestedSort.split(",", -1);
        if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
            throw new IllegalArgumentException("Invalid sort");
        }
        String field = parts[0].trim();
        if (!allowedSortFields.contains(field)) {
            throw new IllegalArgumentException("Invalid sort field");
        }
        return new PageRequest(resolvedPage, resolvedSize, field, SortDirection.from(parts[1]));
    }
}
