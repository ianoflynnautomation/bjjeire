package com.bjjeire.api.testsupport;

import com.bjjeire.api.competitor.IdentityDirectory;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Stands in for Microsoft Graph: records each identity the API asks to delete, and can be told to fail. */
public class RecordingIdentityDirectory implements IdentityDirectory {
    private final List<String> deleted = new CopyOnWriteArrayList<>();
    private volatile boolean failing;

    @Override
    public void deleteUser(String objectId) {
        deleted.add(objectId);
        if (failing) {
            throw new IdentityDirectoryException("The directory is unavailable (test).");
        }
    }

    /** Object ids passed to {@link #deleteUser}, in call order. */
    public List<String> deleted() {
        return List.copyOf(deleted);
    }

    /** Makes every later delete throw after it has been recorded. */
    public void failFromNowOn() {
        failing = true;
    }

    void reset() {
        deleted.clear();
        failing = false;
    }
}
