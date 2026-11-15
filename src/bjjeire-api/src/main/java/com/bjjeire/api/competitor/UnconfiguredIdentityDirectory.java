package com.bjjeire.api.competitor;

import lombok.extern.slf4j.Slf4j;

/**
 * Used while no Graph credentials are configured: deletes nothing in the tenant and says so. The deleted-identity
 * record still stops the person's tokens at the API (research R11 fallback); the identity is then removed by hand.
 */
@Slf4j
class UnconfiguredIdentityDirectory implements IdentityDirectory {
    @Override
    public void deleteUser(String objectId) {
        throw new IdentityDirectoryException(
                "No competitor directory credentials are configured (bjjeire.competitor-directory)."
                        + " Remove the user from the external tenant by hand.");
    }
}
