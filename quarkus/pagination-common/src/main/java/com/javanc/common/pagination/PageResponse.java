package com.javanc.common.pagination;

import java.util.List;

public record PageResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious) {

    public static <T> PageResponse<T> of(List<T> items, PageRequest request, long totalElements) {
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / request.size());
        return new PageResponse<>(
                items == null ? List.of() : List.copyOf(items),
                request.page(),
                request.size(),
                totalElements,
                totalPages,
                request.page() + 1 < totalPages,
                request.page() > 0);
    }
}
