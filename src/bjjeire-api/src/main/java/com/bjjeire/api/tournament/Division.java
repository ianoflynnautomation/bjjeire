package com.bjjeire.api.tournament;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One category competitors enter. Embedded in its tournament; sign-ups refer to it by {@code id}. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Division {
    private String id;
    private Discipline discipline;
    private Gender gender;
    private AgeCategory ageCategory;
    private Belt belt;
    private String weightClass;
}
