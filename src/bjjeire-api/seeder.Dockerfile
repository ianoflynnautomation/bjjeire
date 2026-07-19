FROM maven:3-eclipse-temurin-25 AS build
WORKDIR /workspace
COPY src/bjjeire-api/pom.xml .
COPY src/bjjeire-api/src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /workspace/target/bjjeire-api-*.jar app.jar
COPY seeder/data /seed-data/data
COPY seeder/data-test /seed-data/data-test
ENV SPRING_PROFILES_ACTIVE=seeder \
    BJJEIRE_SEEDER_DATAROOT=/seed-data
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
