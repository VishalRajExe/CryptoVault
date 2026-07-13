package com.vishal.controller;


import com.vishal.config.JwtProvider;
import com.vishal.exception.UserException;
import com.vishal.model.TwoFactorOTP;
import com.vishal.model.User;
import com.vishal.repository.UserRepository;
import com.vishal.request.LoginRequest;
import com.vishal.response.AuthResponse;
import com.vishal.service.*;
import com.vishal.utils.OtpUtils;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;


@RestController
@RequestMapping("/auth")
public class AuthController {

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private CustomeUserServiceImplementation customUserDetails;
	
	@Autowired
    private UserService userService;

	@Autowired
	private WatchlistService watchlistService;

	@Autowired
	private WalletService walletService;

	@Autowired
	private VerificationService verificationService;

	@Autowired
	private TwoFactorOtpService twoFactorOtpService;

	@Autowired
	private EmailService emailService;

	@Autowired
	private NotificationService notificationService;

	

	@PostMapping("/signup")
	public ResponseEntity<AuthResponse> createUserHandler(
			@RequestBody User user) throws UserException {

		String email = user.getEmail();
		String password = user.getPassword();
		String fullName = user.getFullName();
		String mobile=user.getMobile();


		User isEmailExist = userRepository.findByEmail(email);

		if (isEmailExist!=null) {

			throw new UserException("Email Is Already Used With Another Account");
		}

		// Create new user
		User createdUser = new User();
		createdUser.setEmail(email);
		createdUser.setFullName(fullName);
		createdUser.setMobile(mobile);
		createdUser.setPassword(passwordEncoder.encode(password));

		// See AdminConfig - the one designated admin email gets ROLE_ADMIN at signup.
		if (com.vishal.config.AdminConfig.ADMIN_EMAIL.equalsIgnoreCase(email)) {
			createdUser.setRole(com.vishal.domain.USER_ROLE.ROLE_ADMIN);
		}

		User savedUser = userRepository.save(createdUser);

		watchlistService.createWatchList(savedUser);

		notificationService.create(savedUser, "SIGNUP", "Welcome to CryptoVault! Your account was created.", null);

		// BUGFIX: previously this Authentication carried NO authorities, so the
		// JWT issued right after signup never contained the user's role claim.
		// Build it the same way the sign-in flow does, using the persisted user's role.
		Authentication authentication = new UsernamePasswordAuthenticationToken(
				email, password, List.of(new SimpleGrantedAuthority(savedUser.getRole().toString())));
		SecurityContextHolder.getContext().setAuthentication(authentication);

		String token = JwtProvider.generateToken(authentication);

		AuthResponse authResponse = new AuthResponse();
		authResponse.setJwt(token);
		authResponse.setMessage("Register Success");

		return new ResponseEntity<AuthResponse>(authResponse, HttpStatus.OK);

	}

	@PostMapping("/signin")
	public ResponseEntity<AuthResponse> signing(@RequestBody LoginRequest loginRequest) throws UserException, MessagingException {

		String username = loginRequest.getEmail();
		String password = loginRequest.getPassword();

		System.out.println(username + " ----- " + password);

		Authentication authentication = authenticate(username, password);

		User user=userService.findUserByEmail(username);

		SecurityContextHolder.getContext().setAuthentication(authentication);

		String token = JwtProvider.generateToken(authentication);

		if(user.getTwoFactorAuth().isEnabled()){
			AuthResponse authResponse = new AuthResponse();
			authResponse.setMessage("Two factor authentication enabled");
			authResponse.setTwoFactorAuthEnabled(true);

			String otp= OtpUtils.generateOTP();

			TwoFactorOTP oldTwoFactorOTP=twoFactorOtpService.findByUser(user.getId());
			if(oldTwoFactorOTP!=null){
				twoFactorOtpService.deleteTwoFactorOtp(oldTwoFactorOTP);
			}


			TwoFactorOTP twoFactorOTP=twoFactorOtpService.createTwoFactorOtp(user,otp,token);

			emailService.sendVerificationOtpEmail(user.getEmail(),otp);

			authResponse.setSession(twoFactorOTP.getId());
			return new ResponseEntity<>(authResponse, HttpStatus.OK);
		}

		AuthResponse authResponse = new AuthResponse();

		authResponse.setMessage("Login Success");
		authResponse.setJwt(token);

		return new ResponseEntity<>(authResponse, HttpStatus.OK);
	}

	private Authentication authenticate(String username, String password) {
		UserDetails userDetails = customUserDetails.loadUserByUsername(username);

		System.out.println("sign in userDetails - " + userDetails);

		if (userDetails == null) {
			System.out.println("sign in userDetails - null " + userDetails);
			throw new BadCredentialsException("Invalid username or password");
		}
		if (!passwordEncoder.matches(password, userDetails.getPassword())) {
			System.out.println("sign in userDetails - password not match " + userDetails);
			throw new BadCredentialsException("Invalid username or password");
		}
		return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
	}


	@GetMapping("/login/google")
	public void redirectToGoogle(HttpServletRequest request, HttpServletResponse response)
			throws IOException {
		// Redirect to the Google OAuth2 authorization URI
		response.sendRedirect("/login/oauth2/authorization/google");
	}

	// NOTE: a manual @GetMapping("/login/oauth2/code/google") handler was removed here.
	// Spring Security's OAuth2LoginAuthenticationFilter already intercepts this exact
	// URL as the registered redirection endpoint and invokes AppConfig's
	// AuthenticationSuccessHandler directly - a controller method mapped to the same
	// path is never actually reached, so it was dead code. The real callback logic now
	// lives in AppConfig's oauth2Login success handler, which persists/looks up the user
	// and issues a working JWT (see AppConfig.java).

	@PostMapping("/two-factor/otp/{otp}")
	public ResponseEntity<AuthResponse> verifySigningOtp(
			@PathVariable String otp,
			@RequestParam String id
	) throws Exception {


		TwoFactorOTP twoFactorOTP = twoFactorOtpService.findById(id);
		if (twoFactorOTP == null) {
			throw new Exception("OTP session not found or expired.");
		}

		if(twoFactorOtpService.verifyTwoFactorOtp(twoFactorOTP,otp)){
			AuthResponse authResponse = new AuthResponse();
			authResponse.setMessage("Two factor authentication verified");
			authResponse.setTwoFactorAuthEnabled(true);
			authResponse.setJwt(twoFactorOTP.getJwt());

			// BUGFIX: the OTP record was never deleted after a successful verification,
			// leaving it valid forever and reusable (replay) for the same login session.
			twoFactorOtpService.deleteTwoFactorOtp(twoFactorOTP);

			return new ResponseEntity<>(authResponse, HttpStatus.OK);
		}
		throw new Exception("invalid otp");
	}



	
}
