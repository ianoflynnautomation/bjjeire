package com.bjjeire.api.web;

import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.validator.engine.HibernateConstraintViolation;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.ObjectError;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
@Slf4j
public class ApiExceptionHandler {
    private static final Map<String, String> ANNOTATION_ERROR_CODES = Map.of(
            "NotBlank", "FIELD_REQUIRED",
            "NotEmpty", "FIELD_REQUIRED",
            "NotNull", "NOT_NULL",
            "Size", "MAX_LENGTH_EXCEEDED",
            "Min", "VALUE_OUT_OF_RANGE",
            "Max", "VALUE_OUT_OF_RANGE",
            "Pattern", "INVALID_FORMAT",
            "ValidObjectId", "INVALID_FORMAT");

    public record ValidationErrorDetail(String field, String message, String errorCode) {}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(
            MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<ValidationErrorDetail> errors = exception.getBindingResult().getAllErrors().stream()
                .map(ApiExceptionHandler::toValidationError)
                .toList();

        return ResponseEntity.badRequest().body(validationProblem(errors, request));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleConstraintViolation(
            ConstraintViolationException exception, HttpServletRequest request) {
        List<ValidationErrorDetail> errors = exception.getConstraintViolations().stream()
                .map(violation -> new ValidationErrorDetail(
                        pascalCasePath(violation.getPropertyPath().toString()),
                        violation.getMessage(),
                        dynamicErrorCode(violation)))
                .toList();

        return ResponseEntity.badRequest().body(validationProblem(errors, request));
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ProblemDetail> handleHandlerMethodValidation(
            HandlerMethodValidationException exception, HttpServletRequest request) {
        List<ValidationErrorDetail> errors = exception.getParameterValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream().map(error -> toValidationError(result, error)))
                .toList();

        return ResponseEntity.badRequest().body(validationProblem(errors, request));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ProblemDetail> handleTypeMismatch(
            MethodArgumentTypeMismatchException exception, HttpServletRequest request) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        detail.setTitle("Bad Request");
        attachTraceId(detail, request);
        return ResponseEntity.badRequest().body(detail);
    }

    @ExceptionHandler({NoSuchElementException.class, NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ProblemDetail> handleNotFound(Exception exception, HttpServletRequest request) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        detail.setType(java.net.URI.create("urn:bjjeire:not-found"));
        detail.setTitle("Resource Not Found");
        attachTraceId(detail, request);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(detail);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleUnauthorized(
            AuthenticationException exception, HttpServletRequest request) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED, "Authentication is required and has failed or has not yet been provided.");
        detail.setType(java.net.URI.create("https://datatracker.ietf.org/doc/html/rfc7235#section-3.1"));
        detail.setTitle("Unauthorized");
        attachTraceId(detail, request);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(detail);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleForbidden(AccessDeniedException exception, HttpServletRequest request) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN, "You do not have permission to perform this action.");
        detail.setType(java.net.URI.create("https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.3"));
        detail.setTitle("Forbidden");
        attachTraceId(detail, request);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(detail);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> handleResponseStatus(
            ResponseStatusException exception, HttpServletRequest request) {
        ProblemDetail detail = exception.getBody();
        attachTraceId(detail, request);
        return ResponseEntity.status(exception.getStatusCode())
                .headers(exception.getHeaders())
                .body(detail);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception exception, HttpServletRequest request) {
        String errorId = UUID.randomUUID().toString();
        log.error("Unhandled API exception. Error ID: {}", errorId, exception);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please contact support with Error ID: " + errorId + ".");
        detail.setType(java.net.URI.create("https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1"));
        detail.setTitle("Internal Server Error");
        detail.setProperty("errorId", errorId);
        attachTraceId(detail, request);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(detail);
    }

    private static ProblemDetail validationProblem(List<ValidationErrorDetail> errors, HttpServletRequest request) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "One or more validation errors occurred. Please see the 'errors' property for details.");
        detail.setType(java.net.URI.create("urn:bjjeire:validation-error"));
        detail.setTitle("Validation Failed");
        detail.setProperty("errors", errors);
        attachTraceId(detail, request);
        return detail;
    }

    private static ValidationErrorDetail toValidationError(
            ParameterValidationResult result, MessageSourceResolvable error) {
        if (error instanceof ObjectError objectError) {
            return toValidationError(objectError);
        }

        String parameterName = result.getMethodParameter().getParameterName();
        String field = pascalCasePath(parameterName != null ? parameterName : "");
        String[] codes = error.getCodes();
        String annotation = codes != null && codes.length > 0 ? codes[codes.length - 1] : "";
        return new ValidationErrorDetail(
                field, error.getDefaultMessage(), ANNOTATION_ERROR_CODES.getOrDefault(annotation, annotation));
    }

    private static ValidationErrorDetail toValidationError(ObjectError error) {
        String field = error instanceof org.springframework.validation.FieldError fieldError
                ? pascalCasePath(fieldError.getField())
                : error.getObjectName();
        return new ValidationErrorDetail(field, error.getDefaultMessage(), errorCode(error));
    }

    private static String errorCode(ObjectError error) {
        try {
            String dynamicCode = dynamicErrorCode(error.unwrap(ConstraintViolation.class));
            if (dynamicCode != null && !dynamicCode.isEmpty()) {
                return dynamicCode;
            }
        } catch (IllegalArgumentException ignored) {
            // Not a bean-validation error; fall through to the Spring code.
        }

        String springCode = error.getCode();
        if (springCode == null) {
            return "";
        }
        return ANNOTATION_ERROR_CODES.getOrDefault(springCode, springCode);
    }

    private static String dynamicErrorCode(ConstraintViolation<?> violation) {
        @SuppressWarnings("unchecked")
        HibernateConstraintViolation<?> hibernateViolation = violation.unwrap(HibernateConstraintViolation.class);
        String payload = hibernateViolation.getDynamicPayload(String.class);
        return payload != null ? payload : "";
    }

    private static String pascalCasePath(String path) {
        StringBuilder result = new StringBuilder(path.length());
        boolean startOfSegment = true;
        for (char c : path.toCharArray()) {
            result.append(startOfSegment ? Character.toUpperCase(c) : c);
            startOfSegment = c == '.';
        }
        return result.toString();
    }

    private static void attachTraceId(ProblemDetail detail, HttpServletRequest request) {
        detail.setInstance(java.net.URI.create(request.getRequestURI()));
        SpanContext spanContext = Span.current().getSpanContext();
        String traceId = spanContext.isValid() ? spanContext.getTraceId() : request.getRequestId();
        detail.setProperty("traceId", traceId);
    }
}
