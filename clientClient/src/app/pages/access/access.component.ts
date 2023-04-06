import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NbComponentStatus, NbGlobalPhysicalPosition, NbGlobalPosition, NbToastrService } from '@nebular/theme';
import { FacesService } from '../../services/faces.service';

@Component({
  selector: 'ngx-access',
  templateUrl: './access.component.html',
  styleUrls: ['./access.component.scss']
})
export class AccessComponent implements OnInit {

  registerForm: FormGroup;
  loading: boolean = false;
  submitted: boolean = false;
  error:any = {
    err: false,
    message : ''
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  roles: string[] = [];
  values = {
    code: 'primary',
    login: 'primary'
  }

  constructor(    
    public faces: FacesService,
    private formBuilder: FormBuilder,
    public router: Router,
    private toastrService: NbToastrService) { }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
    code: ['', [Validators.required]],
    });
  }

  get f() { return this.registerForm.controls; }


  onSubmit(){
    this.submitted = true;
    this.loading = true;
    this.values = {
      code: 'primary',
      login: 'primary'
    }

    this.faces.logIn(this.registerForm.controls['code'].value).subscribe(
      data => {
        this.router.navigateByUrl('/pages/site?url=' + data['site'])
      },
      err => {
        this.errorMessage = err.error.message;
        if(err.error.type == 'notFound'){
          this.values.code = 'danger'
          this.registerForm.controls['code'].setErrors({required:true})
        }
        this.loading = false;
      }
    );
  }

  destroyByClick = true;
  duration = 10000;
  hasIcon = true;
  position: NbGlobalPosition = NbGlobalPhysicalPosition.TOP_RIGHT;
  preventDuplicates = false;
  status: NbComponentStatus = 'warning';
  
  private showToast( body: string) {
    const config = {
      status: this.status,
      destroyByClick: this.destroyByClick,
      duration: this.duration,
      hasIcon: this.hasIcon,
      position: this.position,
      preventDuplicates: this.preventDuplicates,
    };
    const titleContent = 'Warning';

    this.toastrService.show(
      body,
      `${titleContent}`,
      config);
  }
}
