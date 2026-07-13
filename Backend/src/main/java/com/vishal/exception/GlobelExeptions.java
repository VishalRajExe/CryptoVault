package com.vishal.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;

@ControllerAdvice
public class GlobelExeptions {

	@ExceptionHandler(UserException.class)
	public ResponseEntity<ErrorDetails> userExceptionHandler(UserException ue, WebRequest req) {
		ErrorDetails error = new ErrorDetails(ue.getMessage(), req.getDescription(false), LocalDateTime.now());
		return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
	}

	@ExceptionHandler(WalletException.class)
	public ResponseEntity<ErrorDetails> walletExceptionHandler(WalletException we, WebRequest req) {
		ErrorDetails error = new ErrorDetails(we.getMessage(), req.getDescription(false), LocalDateTime.now());
		return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
	}

	@ExceptionHandler(OrderException.class)
	public ResponseEntity<ErrorDetails> orderExceptionHandler(OrderException oe, WebRequest req) {
		ErrorDetails error = new ErrorDetails(oe.getMessage(), req.getDescription(false), LocalDateTime.now());
		return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
	}

	/**
	 * Catches DB unique-constraint and foreign-key violations.
	 * Returns 409 Conflict with a clean business message – never exposes
	 * the raw SQL error, constraint name, or stack trace.
	 */
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ErrorDetails> handleDataIntegrityViolation(
			DataIntegrityViolationException ex, WebRequest request) {
		String rootMsg = ex.getRootCause() != null ? ex.getRootCause().getMessage().toLowerCase() : "";
		String userMessage;
		if (rootMsg.contains("payment_details") || rootMsg.contains("paymentdetails")) {
			userMessage = "Bank details already exist for this account.";
		} else if (rootMsg.contains("wallet")) {
			userMessage = "A wallet already exists for this account.";
		} else {
			userMessage = "A record with these details already exists. Please review your input.";
		}
		ErrorDetails error = new ErrorDetails(userMessage, request.getDescription(false), LocalDateTime.now());
		return new ResponseEntity<>(error, HttpStatus.CONFLICT);
	}

	/**
	 * Catches Spring Security access-denied events that bubble past the filter
	 * chain (e.g. @PreAuthorize rejects a call). Returns a clean 403.
	 */
	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ErrorDetails> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
		ErrorDetails error = new ErrorDetails(
				"You do not have permission to perform this action.",
				request.getDescription(false), LocalDateTime.now());
		return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
	}

	@ExceptionHandler(RuntimeException.class)
	public ResponseEntity<ErrorDetails> handleRuntimeException(RuntimeException ex, WebRequest request) {
		ErrorDetails error = new ErrorDetails(ex.getMessage(), request.getDescription(false), LocalDateTime.now());
		return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorDetails> handleOtherExceptions(Exception ex, WebRequest request) {
		ex.printStackTrace();
		ErrorDetails error = new ErrorDetails(
				"INTERNAL_ERROR: " + ex.getClass().getName() + ": " + ex.getMessage(),
				request.getDescription(false), LocalDateTime.now());
		return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
