package com.bjjeire.api.config;

import com.bjjeire.api.web.ProblemTypes;
import java.io.IOException;
import java.io.Writer;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import org.apache.catalina.connector.Request;
import org.apache.catalina.connector.Response;
import org.apache.catalina.valves.ErrorReportValve;
import org.apache.coyote.ActionCode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import tools.jackson.databind.ObjectMapper;

/**
 * Answers the errors Tomcat raises before a request reaches Spring, such as an encoded NUL in the path, with the same
 * RFC 9457 problem document as {@code web.ApiExceptionHandler} instead of Tomcat's HTML page. An error Spring already
 * wrote a body for is left alone.
 */
class ProblemErrorReportValve extends ErrorReportValve {
    private final ObjectMapper objectMapper;

    ProblemErrorReportValve(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void report(Request request, Response response, Throwable throwable) {
        int status = response.getStatus();
        if (status < 400 || response.getContentWritten() > 0) {
            return;
        }
        AtomicBoolean ioAllowed = new AtomicBoolean(false);
        response.getCoyoteResponse().action(ActionCode.IS_IO_ALLOWED, ioAllowed);
        if (!ioAllowed.get()) {
            return;
        }
        try {
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            Writer writer = response.getReporter();
            if (writer != null) {
                writer.write(objectMapper.writeValueAsString(problem(request, status)));
                response.finishResponse();
            }
        } catch (IOException | IllegalStateException failed) {
            // The response could not be written; the status line already went out.
            container.getLogger().debug("Problem document not written", failed);
        }
    }

    private static Map<String, Object> problem(Request request, int status) {
        HttpStatus httpStatus = HttpStatus.resolve(status);
        Map<String, Object> problem = new LinkedHashMap<>();
        problem.put("type", typeOf(status).toString());
        problem.put("title", httpStatus == null ? "Error" : httpStatus.getReasonPhrase());
        problem.put("status", status);
        problem.put(
                "detail",
                status == HttpStatus.BAD_REQUEST.value()
                        ? "The request could not be read. Check the address and headers."
                        : "The request could not be handled.");
        String path = request.getRequestURI();
        if (path != null) {
            try {
                problem.put("instance", URI.create(path).toString());
            } catch (IllegalArgumentException unparseable) {
                // The address itself is what was malformed; leave instance out rather than echo it.
            }
        }
        problem.put("traceId", request.getRequestId());
        return problem;
    }

    private static URI typeOf(int status) {
        return switch (status) {
            case 400 -> ProblemTypes.BAD_REQUEST;
            case 404 -> ProblemTypes.NOT_FOUND;
            case 405 -> ProblemTypes.METHOD_NOT_ALLOWED;
            default -> ProblemTypes.INTERNAL;
        };
    }
}
