FROM maven:3-eclipse-temurin-25 AS deps
WORKDIR /workspace
COPY pom.xml .
COPY config ./config
RUN mvn -q -B -DskipTests dependency:go-offline

FROM deps AS build
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:25-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --no-create-home app \
    && mkdir -p /app && chown app:app /app
WORKDIR /app
COPY --from=build --chown=app:app /workspace/target/bjjeire-api-*.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
