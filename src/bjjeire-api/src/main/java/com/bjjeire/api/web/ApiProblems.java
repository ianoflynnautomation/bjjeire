package com.bjjeire.api.web;

import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class ApiProblems {
    private static final URI NOT_FOUND = ProblemTypes.NOT_FOUND;
    private static final URI VALIDATION = ProblemTypes.VALIDATION;

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

    /**
     * A 409 for a business rule. The type tells clients which rule refused the request.
     *
     * @param type a {@link ProblemTypes} URI
     * @param detail what the caller should do about it
     * @return the exception to throw
     */
    public static ResponseStatusException conflict(URI type, String detail) {
        return problem(HttpStatus.CONFLICT, type, "Conflict", detail);
    }

    /**
     * A 400 for a rule that bean validation cannot express.
     *
     * @param field PascalCase field path, as in every other validation error
     * @param message what is wrong
     * @param errorCode stable code for clients
     * @return the exception to throw
     */
    public static ResponseStatusException validation(String field, String message, String errorCode) {
        ResponseStatusException exception = problem(
                HttpStatus.BAD_REQUEST,
                VALIDATION,
                "Validation Failed",
                "One or more validation errors occurred. Please see the 'errors' property for details.");
        exception
                .getBody()
                .setProperty(
                        "errors", List.of(new ApiExceptionHandler.ValidationErrorDetail(field, message, errorCode)));
        return exception;
    }

    private static ResponseStatusException problem(HttpStatus status, URI type, String title, String detail) {
        ResponseStatusException exception = new ResponseStatusException(status, detail);
        exception.setType(type);
        exception.setTitle(title);
        return exception;
    }
}
