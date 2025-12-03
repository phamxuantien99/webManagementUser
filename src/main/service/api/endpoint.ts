export const api = {
  getLogin: `/auth/sign-in`,

  postProjectCodeConfirm: (
    project_number: string,
    client_name: string,
    location: string,
    personal_contact: string,
    telephone_number: string
  ) =>
    `/measurement/project_confirm?project_number=${encodeURIComponent(
      project_number
    )}&client_name=${client_name}&location=${location}&person_contract=${personal_contact}&telephone_number=${telephone_number}`,

  getProjectCode: (currentPage: number, searchValue: string) =>
    `/measurement/project_confirm?page=${currentPage}&location_or_client_name_filter=${searchValue}`,

  getListProjectCodeHaveMeasurementReport: (
    currentPage?: number,
    search?: string
  ) =>
    `/measurement/projects_that_have_measurement_report?page=${currentPage}&filter_by_location_or_project_or_client=${search}`,

  getListProjectCodeHaveSurveyReport: (currentPage?: number, search?: string) =>
    `/measurement/projects_that_have_survey_report?page=${currentPage}&filter_by_location_or_project_or_client=${search}`,

  getListSummaryReportSurvey: (project_session: string) =>
    `/measurement/combined_survey_reports/${project_session}`,
  getMeasurementReport: (
    currentPage: number,
    stattus: string,
    searchValue: string
  ) =>
    `/measurement/measurement_report?page=${currentPage}&confirm_status=${stattus}&filter_by_location_or_project_or_client=${searchValue}`,

  getListSummaryReportMeasurement: (
    measurement_project_code: string,
    search?: string
  ) =>
    `/measurement/summary_measurement_reports/${encodeURIComponent(
      measurement_project_code
    )}?filter_by_door_number_or_serial_no=${search}`,

  getDetailMeasurementReport: (id: number) =>
    `/measurement/measurement_report/{measurement_report_id}?measurement_request_id=${id}`,

  getMeasurementReportSummary: (project_number: string) =>
    `/measurement/summary_measurement_reports/${encodeURIComponent(
      project_number
    )}`,

  getSurveyReport: (
    currentPage: number,
    stattus: string,
    searchValue: string
  ) =>
    `/measurement/survey_reports?page=${currentPage}&confirm_status=${stattus}&project_code=${searchValue}`,

  getDetailSurveyReport: (id: number) => `/measurement/survey_reports/${id}`,

  getSurveyReportSummary: (project_session: string) =>
    `/measurement/combined_survey_reports/${project_session}`,

  // get analysis report
  getAnalysisReport: ({
    start_date,
    end_date,
  }: {
    start_date: string;
    end_date: string;
  }) =>
    `https://ec2api.deltatech-backend.com/api/v1/measurement/gen-analysis-measurement-report?start_date=${start_date}&end_date=${end_date}`,
};
