package com.bjjeire.api.web;

import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class ApiProblems {
    private static final URI NOT_FOUND = URI.create("urn:bjjeire:not-found");
    private static final URI VALIDATION = URI.create("urn:bjjeire:validation-error");

    private ApiProblems() {}

    public static ResponseStatusException notFound() {
        return problem(HttpStatus.NOT_FOUND, NOT_FOUND, "Resource Not Found", "The requested resource was not found.");
    }

    public static ResponseStatusException idMismatch() {
        ResponseStatusException exception = problem(
                HttpStatus.BAD_REQUEST,
                VALIDATION,
                "Validation Failed",
                "The id in the path does not match the id in the body.");
        exception
                .getBody()
                .setProperty(
                        "errors",
                        List.of(new ApiExceptionHandler.ValidationErrorDetail(
                                "Id", "The id in the path does not match the id in the body.", "ID_MISMATCH")));
        return exception;
    }

    private static ResponseStatusException problem(HttpStatus status, URI type, String title, String detail) {
        ResponseStatusException exception = new ResponseStatusException(status, detail);
        exception.setType(type);
        exception.setTitle(title);
        return exception;
    }
}
