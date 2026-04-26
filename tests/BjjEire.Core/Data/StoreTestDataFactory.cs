// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Domain.Entities.Stores;

using Bogus;

using MongoDB.Bson;

namespace BjjEire.Core.Data;

public static class StoreTestDataFactory
{
    private static Faker<Store> StoreEntityGenerator { get; } = new Faker<Store>()
        .RuleFor(x => x.Id, _ => ObjectId.GenerateNewId().ToString())
        .RuleFor(x => x.Name, f => $"{f.Company.CompanyName()} BJJ Store")
        .RuleFor(x => x.Description, f => f.Lorem.Sentence(10))
        .RuleFor(x => x.WebsiteUrl, f => $"https://www.{f.Internet.DomainWord()}store.ie")
        .RuleFor(x => x.LogoUrl, f => $"https://www.{f.Internet.DomainWord()}store.ie/logo.png")
        .RuleFor(x => x.IsActive, _ => true);

    public static Store CreateStore(Action<Store>? configure = null)
    {
        Store store = StoreEntityGenerator.Generate();
        configure?.Invoke(store);
        return store;
    }
}
