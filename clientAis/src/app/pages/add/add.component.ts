import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbWindowRef } from '@nebular/theme';
import { FacesService } from '../../services/faces.service';

@Component({
  selector: 'ngx-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss']
})
export class AddComponent implements OnInit {

  registerForm: FormGroup;
  is_saving : boolean = false;
  submitted = false;
  values:any = {
    name: 'primary',
    nickname: 'primary',
  }
  edit : boolean = false;
  @Input() onChange: Function;
  @Input() id: string;
  snippet: string;
  constructor(
    private formBuilder: FormBuilder,
    protected windowRef: NbWindowRef,
    private facesService: FacesService,
    ) { }

  ngOnInit(): void {
    if(this.id != undefined){
      this.edit = true
      this.facesService.getSite(this.id)
        .subscribe(
          res =>{
            console.log(res)
            this.registerForm.controls['name'].setValue(res['publ'].name)
            this.registerForm.controls['nickname'].setValue(res['publ'].nickname)
            this.registerForm.controls['adsperimage'].setValue(res['publ'].adsperimage)
          },
          err => console.error(err)
      )
    }else{
      this.facesService.getServer().subscribe(
        res =>  this.snippet = `'<script type="text/javascript" src="${res['server']}/system/g3c.scan.image.sph.js"></script>'`
      )
    }

    this.registerForm = this.formBuilder.group({
      nickname: ['', ],
      adsperimage: [1, ],
      name: ['', [Validators.required]],
    });
  }

  get f() { return this.registerForm.controls; }

  onSubmit() {
  this.submitted = true;
  this.values = {
    name: 'primary',
    adsperimage: 1,
    nickname: 'primary'
  }
  // stop here if form is invalid
  if (this.registerForm.invalid) {
    const controls = this.registerForm.controls;
    for (const name in controls) {
        if (controls[name].invalid) {
            this.values[name] = 'danger'
        }
    }
      return;
  }
  this.is_saving = true;
  if(this.edit == false){
    this.facesService.saveSite(this.registerForm.value).subscribe(
    res => {
      this.onChange()
      this.windowRef.close();
    },
    err => {
      this.is_saving = false;
      // this.registerForm.controls[err.error].setErrors({used:true})
      if (err.error.repeated === 'name'){
          this.values.name = 'danger';
          this.registerForm.controls['name'].setErrors({cantMatch: true});
      }
    }
    )
  }else if(this.edit == true){
    this.registerForm.value.id = this.id
    this.facesService.updateSite(this.registerForm.value)
    .subscribe(
    res => {
      this.onChange()
      this.windowRef.close();
    },
    err => console.log(err)
  );
  }

}

}
