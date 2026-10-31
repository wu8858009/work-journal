# Builds the WorkJournalApi backend and bundles the static frontend into the same
# image, reusing the exact "serve frontend from AppContext.BaseDirectory" fallback
# Program.cs already has for the portable desktop build — no extra code path needed.

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/WorkJournalApi/WorkJournalApi.csproj backend/WorkJournalApi/
RUN dotnet restore backend/WorkJournalApi/WorkJournalApi.csproj
COPY backend/WorkJournalApi/ backend/WorkJournalApi/
RUN dotnet publish backend/WorkJournalApi/WorkJournalApi.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY index.html app.js styles.css config.js data.js manifest.json icon.svg sw.js ./

# Render tells the container which port to listen on via $PORT at runtime; fall back
# to 8080 for local `docker run` testing.
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet WorkJournalApi.dll"]
