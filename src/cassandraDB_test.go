package main

import (
	"testing"
	"time"
)

func TestParseDate(t *testing.T) {
	var result *time.Time
	var err error

	// Test happy PM path (i.e. valid date string).
	result, err = parseDate("03-31-20-09-55PM")
	if err != nil {
		t.Error("parseDate(03-31-20-09-55PM): returned error:", err)
	}
	if result == nil {
		t.Error("parseDate(03-31-20-09-55PM): returned nil result")
	}
	if result.Day() != 31 {
		t.Errorf("parseDate(03-31-20-09-55PM): Day value, expected 31, got %d", result.Day())
	}
	if result.Month() != 3 {
		t.Errorf("parseDate(03-31-20-09-55PM): Month value, expected 3, got %d", result.Month())
	}
	if result.Year() != 2020 {
		t.Errorf("parseDate(03-31-20-09-55PM): Year value, expected 2020, got %d", result.Year())
	}
	if result.Hour() != 21 {
		t.Errorf("parseDate(03-31-20-09-55PM): Hour value, expected 21, got %d", result.Hour())
	}
	if result.Minute() != 55 {
		t.Errorf("parseDate(03-31-20-09-55PM): Minute value, expected 55, got %d", result.Minute())
	}

	// Test happy AM path (i.e. valid date string).
	result, err = parseDate("03-31-20-09-55AM")
	if err != nil {
		t.Error("parseDate(03-31-20-09-55AM): returned error:", err)
	}
	if result == nil {
		t.Error("parseDate(03-31-20-09-55AM): returned nil result")
	}
	if result.Day() != 31 {
		t.Errorf("parseDate(03-31-20-09-55AM): Day value, expected 31, got %d", result.Day())
	}
	if result.Month() != 3 {
		t.Errorf("parseDate(03-31-20-09-55AM): Month value, expected 3, got %d", result.Month())
	}
	if result.Year() != 2020 {
		t.Errorf("parseDate(03-31-20-09-55AM): Year value, expected 2020, got %d", result.Year())
	}
	if result.Hour() != 9 {
		t.Errorf("parseDate(03-31-20-09-55AM): Hour value, expected 9, got %d", result.Hour())
	}
	if result.Minute() != 55 {
		t.Errorf("parseDate(03-31-20-09-55AM): Minute value, expected 55, got %d", result.Minute())
	}

	// Test noon corner case.
	result, err = parseDate("03-31-20-12-00PM")
	if err != nil {
		t.Error("parseDate(03-31-20-12-00PM): returned error:", err)
	}
	if result == nil {
		t.Error("parseDate(03-31-20-12-00PM): returned nil result")
	}
	if result.Day() != 31 {
		t.Errorf("parseDate(03-31-20-12-00PM): Day value, expected 31, got %d", result.Day())
	}
	if result.Month() != 3 {
		t.Errorf("parseDate(03-31-20-12-00PM): Month value, expected 3, got %d", result.Month())
	}
	if result.Year() != 2020 {
		t.Errorf("parseDate(03-31-20-12-00PM): Year value, expected 2020, got %d", result.Year())
	}
	if result.Hour() != 12 {
		t.Errorf("parseDate(03-31-20-12-00PM): Hour value, expected 12, got %d", result.Hour())
	}
	if result.Minute() != 0 {
		t.Errorf("parseDate(03-31-20-12-00PM): Minute value, expected 00, got %d", result.Minute())
	}

	// Test midnight corner case. Assuming 12:00 AM on the morning of 3/31/20 (not 4/1/20).
	result, err = parseDate("03-31-20-12-00AM")
	if err != nil {
		t.Error("parseDate(03-31-20-12-00AM): returned error:", err)
	}
	if result == nil {
		t.Error("parseDate(03-31-20-12-00AM): returned nil result")
	}
	if result.Day() != 31 {
		t.Errorf("parseDate(03-31-20-12-00AM): Day value, expected 31, got %d", result.Day())
	}
	if result.Month() != 3 {
		t.Errorf("parseDate(03-31-20-12-00AM): Month value, expected 3, got %d", result.Month())
	}
	if result.Year() != 2020 {
		t.Errorf("parseDate(03-31-20-12-00AM): Year value, expected 2020, got %d", result.Year())
	}
	if result.Hour() != 0 {
		t.Errorf("parseDate(03-31-20-12-00AM): Hour value, expected 0, got %d", result.Hour())
	}
	if result.Minute() != 0 {
		t.Errorf("parseDate(03-31-20-12-00AM): Minute value, expected 00, got %d", result.Minute())
	}

	// Test bad format, missing month.
	result, err = parseDate("-31-20-12-00AM")
	if err != nil {
		// Parsing failed, so this is a successful result.
		t.Log("parseDate(-31-20-12-00AM): returned error:", err)
	}
	if result == nil {
		// Parsing failed so this is a successful result.
		t.Log("parseDate(-31-20-12-00AM): returned nil result")
	}
}

func TestParseFilename(t *testing.T) {
	var owner string
	var date *time.Time
	var err error

	// Test happy path (i.e. valid filename string).
	owner, date, err = parseFilename("B827EBEADCAB_Logs_03-31-20-09-55PM.tgz")
	if err != nil {
		t.Error("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): returned error:", err)
	}
	if owner == "" {
		t.Error("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): returned nil owner:", err)
	}
	if owner != "B827EBEADCAB" {
		t.Errorf("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): owner, expected B827EBEADCAB, got %s", owner)
	}
	if date == nil {
		t.Error("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): returned nil date:", err)
	}
	if date.Day() != 31 {
		t.Errorf("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): Day value, expected 31, got %d", date.Day())
	}
	if date.Month() != 3 {
		t.Errorf("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): Month value, expected 3, got %d", date.Month())
	}
	if date.Year() != 2020 {
		t.Errorf("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): Year value, expected 2020, got %d", date.Year())
	}
	if date.Hour() != 21 {
		t.Errorf("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): Hour value, expected 21, got %d", date.Hour())
	}
	if date.Minute() != 55 {
		t.Errorf("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): Minute value, expected 55, got %d", date.Minute())
	}

	// Test bad string (i.e. invalid filename).
	owner, date, err = parseFilename("_Logs_03-31-20-09-55PM.tgz")
	if err != nil {
		// Parsing failed so this is a successful result.
		t.Log("parseFilename(_Logs_03-31-20-09-55PM.tgz): returned error:", err)
	}
	if owner == "" {
		// Parsing failed so this is a successful result.
		t.Log("parseFilename(_Logs_03-31-20-09-55PM.tgz): returned empty owner:", err)
	}
	if date == nil {
		// Parsing should have returned a valid date.
		t.Error("parseFilename(B827EBEADCAB_Logs_03-31-20-09-55PM.tgz): returned nil date:", err)
	}

	// Test bad string (i.e. invalid filename).
	owner, date, err = parseFilename("_Logs_")
	if err != nil {
		// Parsing failed so this is a successful result.
		t.Log("parseFilename(_Logs_): returned error:", err)
	}
	if owner == "" {
		// Parsing failed so this is a successful result.
		t.Log("parseFilename(_Logs_): returned empty owner:", err)
	}
	if date == nil {
		// Parsing failed so this is a successful result.
		t.Log("parseFilename(_Logs_): returned nil date:", err)
	}
}
