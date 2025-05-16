// // BjjEire.Application.UnitTests/Features/Gyms/Validators/GymDtoValidatorTests.cs
// using BjjEire.Application.Common.DTOs;
// using BjjEire.Application.Features.Gyms.DTOs;
// using BjjEire.Application.Features.Gyms.Validators;
// using BjjEire.Domain.Enums;
// using FluentValidation;
// using FluentValidation.TestHelper;
// using Moq;
// using NUnit.Framework;

// namespace BjjEire.Application.UnitTests.Features.Gyms.Validators;

// [TestFixture]
// public class GymDtoValidatorTests
// {
//     private GymDtoValidator _validator;
//     private Mock<IValidator<SocialMediaDto>> _mockSocialMediaValidator;
//     private Mock<IValidator<LocationDto>> _mockLocationValidator;
//     private Mock<IValidator<TrialOfferDto>> _mockTrialOfferValidator;

//     [SetUp]
//     public void SetUp()
//     {
//         _mockSocialMediaValidator = new Mock<IValidator<SocialMediaDto>>();
//         _mockLocationValidator = new Mock<IValidator<LocationDto>>();
//         _mockTrialOfferValidator = new Mock<IValidator<TrialOfferDto>>();

//         // Setup mocks to return valid result by default, so we only test GymDtoValidator rules
//         _ = _mockSocialMediaValidator.Setup(v => v.Validate(It.IsAny<IValidationContext>()))
//                                  .Returns(new FluentValidation.Results.ValidationResult());
//         _ = _mockLocationValidator.Setup(v => v.Validate(It.IsAny<IValidationContext>()))
//                               .Returns(new FluentValidation.Results.ValidationResult());
//         _ = _mockTrialOfferValidator.Setup(v => v.Validate(It.IsAny<IValidationContext>()))
//                                 .Returns(new FluentValidation.Results.ValidationResult());


//         _validator = new GymDtoValidator(
//             _mockSocialMediaValidator.Object,
//             _mockLocationValidator.Object,
//             _mockTrialOfferValidator.Object);
//     }

//     [Test]
//     public void Name_WhenNullOrEmpty_ShouldHaveValidationError()
//     {
//         var model = new GymDto { Name = null };
//         var result = _validator.TestValidate(model);
//         _ = result.ShouldHaveValidationErrorFor(x => x.Name)
//               .WithErrorMessage("'Gym name' must not be empty."); // Or your specific message from ApplyRequiredString
//     }

//     [Test]
//     public void Name_WhenExceedsMaxLength_ShouldHaveValidationError()
//     {
//         var model = new GymDto { Name = new string('a', 101) };
//         var result = _validator.TestValidate(model);
//         _ = result.ShouldHaveValidationErrorFor(x => x.Name);
//         // .WithErrorMessage("The length of 'Gym name' must be 100 characters or fewer. You entered 101 characters."); // Check actual message
//     }

//     [Test]
//     public void Name_WhenValid_ShouldNotHaveValidationError()
//     {
//         var model = new GymDto { Name = "Valid Gym Name" };
//         var result = _validator.TestValidate(model);
//         result.ShouldNotHaveValidationErrorFor(x => x.Name);
//     }

//     [Test]
//     public void Description_WhenExceedsMaxLength_ShouldHaveValidationError()
//     {
//         var model = new GymDto { Description = new string('a', 501) }; // As per your message
//         var result = _validator.TestValidate(model);
//         _ = result.ShouldHaveValidationErrorFor(x => x.Description)
//               .WithErrorMessage("Description must be 500 characters or less.")
//               .WithErrorCode("MaxLengthValidator");
//     }


//     [Test]
//     public void Status_WhenInvalidEnumValue_ShouldHaveValidationError()
//     {
//         var model = new GymDto { Status = (GymStatus)999 }; // Invalid enum int value
//         var result = _validator.TestValidate(model);
//         _ = result.ShouldHaveValidationErrorFor(x => x.Status)
//               .WithErrorMessage("'Gym status' has a range of values which does not include '999'."); // Check actual message from ApplyEnumValidator
//     }

//     [Test]
//     public void Status_WhenValidEnumValue_ShouldNotHaveValidationError()
//     {
//         var model = new GymDto { Status = GymStatus.Active };
//         var result = _validator.TestValidate(model);
//         result.ShouldNotHaveValidationErrorFor(x => x.Status);
//     }


//     [Test]
//     public void County_WhenNullOrEmpty_ShouldHaveValidationError()
//     {
//         var model = new GymDto { County = string.Empty };
//         var result = _validator.TestValidate(model);
//         _ = result.ShouldHaveValidationErrorFor(x => x.County);
//     }

//     [TestCase("http://valid.com")]
//     [TestCase("https://valid.com/path")]
//     [TestCase(null)] // Optional URLs are fine if null/empty
//     [TestCase("")]
//     public void Website_WhenValidOrOptional_ShouldNotHaveValidationError(string url)
//     {
//         var model = new GymDto { Website = url };
//         var result = _validator.TestValidate(model);
//         result.ShouldNotHaveValidationErrorFor(x => x.Website);
//     }

//     [Test]
//     public void Website_WhenInvalidUrl_ShouldHaveValidationError()
//     {
//         var model = new GymDto { Website = "invalid-url" };
//         var result = _validator.TestValidate(model);
//         _ = result.ShouldHaveValidationErrorFor(x => x.Website)
//               .WithErrorMessage("{PropertyName} must be a valid URL.");
//     }

//     [Test]
//     public void TrialOffer_WhenNull_ShouldHaveValidationError()
//     {
//         var model = new GymDto { TrialOffer = null };
//         var result = _validator.TestValidate(model);
//         _ = result.ShouldHaveValidationErrorFor(x => x.TrialOffer)
//               .WithErrorMessage("'TrialOffer' must not be empty."); // Check message from ApplyNotNullValidator
//     }

//     [Test]
//     public void SocialMedia_WhenNull_ShouldHaveValidationError()
//     {
//         var model = new GymDto { SocialMedia = null };
//         var result = _validator.TestValidate(model);
//         _ = result.ShouldHaveValidationErrorFor(x => x.SocialMedia);
//     }

//     [Test]
//     public void Location_WhenNull_ShouldHaveValidationError()
//     {
//         var model = new GymDto { Location = null };
//         var result = _validator.TestValidate(model);
//         _ = result.ShouldHaveValidationErrorFor(x => x.Location);
//     }

//     // Add similar tests for TimetableUrl and ImageUrl
// }