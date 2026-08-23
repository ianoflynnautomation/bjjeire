FROM maven:3-eclipse-temurin-25 AS deps
WORKDIR /workspace
COPY src/bjjeire-api/pom.xml .
COPY src/bjjeire-api/config ./config
RUN mvn -q -B -DskipTests dependency:go-offline

FROM deps AS build
COPY src/bjjeire-api/src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:25-jre
RUN useradd --system --uid 10001 --no-create-home app \
    && mkdir -p /app /seed-data && chown -R app:app /app /seed-data
WORKDIR /app
COPY --from=build --chown=app:app /workspace/target/bjjeire-api-*.jar app.jar
COPY --chown=app:app seeder/data /seed-data/data
COPY --chown=app:app seeder/data-test /seed-data/data-test
USER 10001
ENV SPRING_PROFILES_ACTIVE=seeder \
    BJJEIRE_SEEDER_DATAROOT=/seed-data
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
