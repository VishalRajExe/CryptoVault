package com.vishal.controller;

import com.vishal.domain.VerificationType;
import com.vishal.exception.UserException;
import com.vishal.model.ForgotPasswordToken;
import com.vishal.model.User;
import com.vishal.model.VerificationCode;
import com.vishal.request.ResetPasswordRequest;
import com.vishal.request.UpdatePasswordRequest;
import com.vishal.response.ApiResponse;
import com.vishal.response.AuthResponse;
import com.vishal.service.EmailService;
import com.vishal.service.ForgotPasswordService;
import com.vishal.service.UserService;
import com.vishal.service.VerificationService;
import com.vishal.utils.OtpUtils;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.vishal.repository.UserRepository;

import java.util.UUID;


@RestController
public class UserController {
	
	@Autowired
	private UserService userService;

	@Autowired
	private VerificationService verificationService;

	@Autowired
	private ForgotPasswordService forgotPasswordService;

	@Autowired
	private EmailService emailService;

	@Autowired
	private com.vishal.repository.UserRepository userRepository;


	@GetMapping("/api/users/profile")
	public ResponseEntity<User> getUserProfileHandler(
			@RequestHeader("Authorization") String jwt) throws UserException {

		User user = userService.findUserProfileByJwt(jwt);
		user.setPassword(null);

		return new ResponseEntity<>(user, HttpStatus.ACCEPTED);
	}
	
	@GetMapping("/api/users/{userId}")
	public ResponseEntity<User> findUserById(
			@PathVariable Long userId,
			@RequestHeader("Authorization") String jwt) throws UserException {

		User user = userService.findUserById(userId);
		user.setPassword(null);

		return new ResponseEntity<>(user, HttpStatus.ACCEPTED);
	}

	@GetMapping("/api/users/email/{email}")
	public ResponseEntity<User> findUserByEmail(
			@PathVariable String email,
			@RequestHeader("Authorization") String jwt) throws UserException {

		User user = userService.findUserByEmail(email);

		return new ResponseEntity<>(user, HttpStatus.ACCEPTED);
	}

	@PatchMapping("/api/users/enable-two-factor/verify-otp/{otp}")
	public ResponseEntity<User> enabledTwoFactorAuthentication(
			@RequestHeader("Authorization") String jwt,
			@PathVariable String otp
	) throws Exception {


		User user = userService.findUserProfileByJwt(jwt);


		VerificationCode verificationCode = verificationService.findUsersVerification(user);

		if (verificationCode == null) {
			throw new Exception("No verification code found. Please request a new OTP first.");
		}

		String sendTo = verificationCode.getVerificationType().equals(VerificationType.EMAIL)
				? verificationCode.getEmail()
				: verificationCode.getMobile();


		boolean isVerified = verificationService.VerifyOtp(otp, verificationCode);

		if (isVerified) {
			User updatedUser = userService.enabledTwoFactorAuthentication(
					verificationCode.getVerificationType(), sendTo, user);
			verificationService.deleteVerification(verificationCode);
			return ResponseEntity.ok(updatedUser);
		}
		throw new Exception("wrong otp");

	}



	@PatchMapping("/auth/users/reset-password/verify-otp")
	public ResponseEntity<ApiResponse> resetPassword(
			@RequestParam String id,
			@RequestBody ResetPasswordRequest req
			) throws Exception {
		ForgotPasswordToken forgotPasswordToken=forgotPasswordService.findById(id);

			boolean isVerified = forgotPasswordService.verifyToken(forgotPasswordToken,req.getOtp());

			if (isVerified) {

				userService.updatePassword(forgotPasswordToken.getUser(),req.getPassword());
				ApiResponse apiResponse=new ApiResponse();
				apiResponse.setMessage("password updated successfully");
				return ResponseEntity.ok(apiResponse);
			}
			throw new Exception("wrong otp");

	}

	@PostMapping("/auth/users/reset-password/send-otp")
	public ResponseEntity<AuthResponse> sendUpdatePasswordOTP(
			@RequestBody UpdatePasswordRequest req)
			throws Exception {

		User user = userService.findUserByEmail(req.getSendTo());
		String otp= OtpUtils.generateOTP();
		UUID uuid = UUID.randomUUID();
		String id = uuid.toString();

		ForgotPasswordToken token = forgotPasswordService.findByUser(user.getId());

		if(token==null){
			token=forgotPasswordService.createToken(
					user,id,otp,req.getVerificationType(), req.getSendTo()
			);
		}

		if(req.getVerificationType().equals(VerificationType.EMAIL)){
			emailService.sendVerificationOtpEmail(
					user.getEmail(),
					token.getOtp()
			);
		}

		AuthResponse res=new AuthResponse();
		res.setSession(token.getId());
		res.setMessage("Password Reset OTP sent successfully.");

		return ResponseEntity.ok(res);

	}

	@PatchMapping("/api/users/verification/verify-otp/{otp}")
	public ResponseEntity<User> verifyOTP(
			@RequestHeader("Authorization") String jwt,
			@PathVariable String otp
	) throws Exception {


		User user = userService.findUserProfileByJwt(jwt);


		VerificationCode verificationCode = verificationService.findUsersVerification(user);

		if (verificationCode == null) {
			throw new Exception("No verification code found. Please request a new OTP first.");
		}


		boolean isVerified = verificationService.VerifyOtp(otp, verificationCode);

		if (isVerified) {
			verificationService.deleteVerification(verificationCode);
			User verifiedUser = userService.verifyUser(user);
			verifiedUser = userRepository.save(verifiedUser);
					return ResponseEntity.ok(verifiedUser);
		}
		throw new Exception("wrong otp");

	}

	@PostMapping("/api/users/verification/{verificationType}/send-otp")
	public ResponseEntity<String> sendVerificationOTP(
			@PathVariable VerificationType verificationType,
			@RequestHeader("Authorization") String jwt)
            throws Exception {

		User user = userService.findUserProfileByJwt(jwt);

		// BUGFIX: previously, if a VerificationCode row already existed for this user
		// (e.g. left over from an earlier "send code" click, an abandoned 2FA-enable
		// attempt, or a cancelled email-verification flow), this endpoint silently
		// reused the OLD code instead of generating and emailing a new one. The UI
		// always said "code sent", so the user had no way to know the code in their
		// inbox was stale - entering what looked like a freshly-requested code would
		// fail against the original row, and clicking "send" again did nothing new,
		// which is exactly the "I have to do it multiple times" symptom. Always
		// delete any existing code first so every click genuinely sends a fresh OTP.
		VerificationCode verificationCode = verificationService.findUsersVerification(user);
		if (verificationCode != null) {
			verificationService.deleteVerification(verificationCode);
		}
		verificationCode = verificationService.sendVerificationOTP(user, verificationType);


		if(verificationType.equals(VerificationType.EMAIL)){
			emailService.sendVerificationOtpEmail(user.getEmail(), verificationCode.getOtp());
		}



		return ResponseEntity.ok("Verification OTP sent successfully.");

	}

	/** New endpoint backing the Security page's "Mobile number" card, which
	 *  previously had no way to actually save a number at all. */
	@PatchMapping("/api/users/mobile")
	public ResponseEntity<User> updateMobile(
			@RequestHeader("Authorization") String jwt,
			@RequestBody java.util.Map<String, String> body) throws Exception {
		User user = userService.findUserProfileByJwt(jwt);
		User updated = userService.updateMobile(user, body.get("mobile"));
		return ResponseEntity.ok(updated);
	}

}
