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

    /**
     * A 400 for a request that is malformed in a way bean validation does not cover, such as a bad webhook signature.
     *
     * @param detail what is wrong
     * @return the exception to throw
     */
    public static ResponseStatusException badRequest(String detail) {
        return problem(HttpStatus.BAD_REQUEST, ProblemTypes.BAD_REQUEST, "Bad Request", detail);
    }

    /**
     * A 403 for a resource that exists but belongs to someone else.
     *
     * @return the exception to throw
     */
    public static ResponseStatusException forbidden() {
        return problem(HttpStatus.FORBIDDEN, ProblemTypes.FORBIDDEN, "Forbidden", "This belongs to another account.");
    }

    /**
     * A 502 for an upstream service the request needed and could not reach.
     *
     * @param type a {@link ProblemTypes} URI
     * @param detail what the caller should do about it
     * @return the exception to throw
     */
    public static ResponseStatusException badGateway(URI type, String detail) {
        return problem(HttpStatus.BAD_GATEWAY, type, "Bad Gateway", detail);
    }

    /**
     * A 503 for a capability that is switched on but not configured in this environment.
     *
     * @param detail what is missing
     * @return the exception to throw
     */
    public static ResponseStatusException serviceUnavailable(String detail) {
        return problem(HttpStatus.SERVICE_UNAVAILABLE, ProblemTypes.SERVICE_UNAVAILABLE, "Service Unavailable", detail);
    }

    /**
     * A 415 for an upload whose content is not a type the route accepts.
     *
     * @param type a {@link ProblemTypes} URI
     * @param detail what the caller may send instead
     * @return the exception to throw
     */
    public static ResponseStatusException unsupportedMediaType(URI type, String detail) {
        return problem(HttpStatus.UNSUPPORTED_MEDIA_TYPE, type, "Unsupported Media Type", detail);
    }

    /**
     * A 413 for a body over a limit the route sets.
     *
     * @param detail the limit, so the caller can send something smaller
     * @return the exception to throw
     */
    public static ResponseStatusException payloadTooLarge(String detail) {
        return problem(HttpStatus.CONTENT_TOO_LARGE, ProblemTypes.PAYLOAD_TOO_LARGE, "Content Too Large", detail);
    }

    private static ResponseStatusException problem(HttpStatus status, URI type, String title, String detail) {
        ResponseStatusException exception = new ResponseStatusException(status, detail);
        exception.setType(type);
        exception.setTitle(title);
        return exception;
    }
}
