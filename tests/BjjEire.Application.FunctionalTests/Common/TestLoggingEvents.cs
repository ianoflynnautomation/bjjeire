// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Application.FunctionalTests.Common;

public class TestLoggingEvents {
    public static class Fixture {
        private const int BaseId = 12000;

        public static readonly EventId SetupStarting = new(BaseId + 1, nameof(SetupStarting));
        public static readonly EventId ContainerStarting = new(BaseId + 2, nameof(ContainerStarting));
        public static readonly EventId ContainerStarted = new(BaseId + 3, nameof(ContainerStarted));
        public static readonly EventId AppConfigurationModifying = new(BaseId + 4, nameof(AppConfigurationModifying));
        public static readonly EventId TestServicesConfiguring = new(BaseId + 5, nameof(TestServicesConfiguring));
        public static readonly EventId TeardownStarting = new(BaseId + 6, nameof(TeardownStarting));
        public static readonly EventId ContainerStopping = new(BaseId + 7, nameof(ContainerStopping));
        public static readonly EventId ContainerStopped = new(BaseId + 8, nameof(ContainerStopped));
        public static readonly EventId SetupComplete = new(BaseId + 9, nameof(SetupComplete));
        public static readonly EventId TeardownComplete = new(BaseId + 10, nameof(TeardownComplete));
    }
}
