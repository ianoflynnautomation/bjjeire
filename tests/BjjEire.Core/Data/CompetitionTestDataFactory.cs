// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Domain.Entities.Competitions;

using Bogus;

using MongoDB.Bson;

namespace BjjEire.Core.Data;

public static class CompetitionTestDataFactory
{
    private static Faker<Competition> CompetitionEntityGenerator { get; } = new Faker<Competition>()
        .RuleFor(x => x.Id, _ => ObjectId.GenerateNewId().ToString())
        .RuleFor(x => x.Slug, f => f.Lorem.Slug())
        .RuleFor(x => x.Name, f => $"{f.Address.City()} BJJ {f.PickRandom("Open", "Championship", "Invitational")}")
        .RuleFor(x => x.Description, f => f.Lorem.Sentence(10))
        .RuleFor(x => x.Organisation, f => f.Company.CompanyName())
        .RuleFor(x => x.Country, _ => "Ireland")
        .RuleFor(x => x.WebsiteUrl, f => $"https://www.{f.Internet.DomainWord()}comp.ie")
        .RuleFor(x => x.RegistrationUrl, f => $"https://www.{f.Internet.DomainWord()}comp.ie/register")
        .RuleFor(x => x.LogoUrl, f => $"https://www.{f.Internet.DomainWord()}comp.ie/logo.png")
        .RuleFor(x => x.Tags, f => f.PickRandom(new[] { "gi", "nogi", "kids", "adults", "beginners" }, f.Random.Int(1, 3)).ToList())
        .RuleFor(x => x.StartDate, f => DateTime.UtcNow.Date.AddDays(f.Random.Int(7, 60)))
        .RuleFor(x => x.EndDate, (f, c) => c.StartDate?.AddDays(f.Random.Int(0, 2)))
        .RuleFor(x => x.IsActive, _ => true);

    public static Competition CreateCompetition(Action<Competition>? configure = null)
    {
        Competition competition = CompetitionEntityGenerator.Generate();
        configure?.Invoke(competition);
        return competition;
    }
}
