FROM maven:3.9.7-eclipse-temurin-17 AS build

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY pom.xml .

# Download dependencies to cache them in a layer
RUN mvn dependency:go-offline -B

# Copy source code
COPY src src

# Build the application
# This command will:
# 1. Download wsdl.xml to /app/src/main/resources/wsdl.xml (via download-maven-plugin)
# 2. Modify /app/src/main/resources/wsdl.xml (via replacer-plugin)
# 3. Generate JAX-WS sources using /app/src/main/resources/wsdl.xml (via jaxws-maven-plugin).
#    The generated client code will expect wsdl.xml on the classpath.
# 4. Compile all sources.
# 5. Package resources from /app/src/main/resources (which should include wsdl.xml) into the JAR.
# 6. Create the final executable JAR.
RUN mvn package -DskipTests

# Create a smaller runtime image
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the built JAR file from the build stage
# The wsdl.xml should be inside this app.jar at the root of the classpath.
COPY --from=build /app/target/*.jar app.jar

# Environment variables
ENV JAVA_OPTS=""

# Set the entry point
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# Expose the correct application port
EXPOSE 8000